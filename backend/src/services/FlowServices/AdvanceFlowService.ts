import * as Sentry from "@sentry/node";
import { logger } from "../../utils/logger";
import { debounce } from "../../helpers/Debounce";
import formatBody from "../../helpers/Mustache";
import { whatsappProvider } from "../../providers/WhatsApp/whatsappProvider";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Flow, { FlowNode, FlowEdge } from "../../models/Flow";
import assignTicketToQueue from "./AssignTicketToQueueHelper";
import RunAiAgentTurnService from "../AgentServices/RunAiAgentTurnService";

// Motor de funil in-process: só seguro com UMA instância do backend em
// execução (mesmo aviso de backend/src/cron/index.ts) — estado de buffers e
// timeouts de debounce vive na memória do processo Node.

const MAX_STEPS = 25;

const findNode = (nodes: FlowNode[], id: string): FlowNode | undefined =>
  nodes.find(n => n.id === id);

const findNextNodeId = (
  edges: FlowEdge[],
  sourceId: string,
  handle?: string
): string | null => {
  const edge =
    handle !== undefined
      ? edges.find(e => e.source === sourceId && e.sourceHandle === handle)
      : edges.find(e => e.source === sourceId);

  return edge?.target ?? null;
};

const chatIdFor = (ticket: Ticket): string => `${ticket.contact.number}@c.us`;

const sendText = async (ticket: Ticket, text: string): Promise<void> => {
  const body = formatBody(text, ticket.contact, ticket.flowVariables);

  try {
    await whatsappProvider.sendMessage(ticket.whatsappId, chatIdFor(ticket), body);
  } catch (error) {
    logger.error("Error sending flow message:", error);
  }
};

const sendMenuText = async (ticket: Ticket, node: FlowNode): Promise<void> => {
  const options = node.data.options ?? [];
  let optionsText = "";
  options.forEach((option, index) => {
    optionsText += `*${index + 1}* - ${option.label}\n`;
  });

  await sendText(ticket, `${node.data.text ?? ""}\n${optionsText}`);
};

const endFlow = async (ticket: Ticket): Promise<void> => {
  await ticket.update({ flowNodeId: null, flowResumeAt: null, flowCallStack: [] });
};

// Encerra o funil por um motivo que NÃO foi um node "end" explícito — ou
// seja, o funil ficou sem próximo passo por falta de configuração (edge
// faltando, node apagado ainda referenciado, loop estourando o limite de
// segurança). O cliente fica sem resposta nesse ponto, então isso precisa
// de visibilidade pro admin (Sentry), não só um log silencioso.
const endFlowAbnormally = async (
  ticket: Ticket,
  reason: string
): Promise<void> => {
  const message = `Flow do ticket ${ticket.id} parou sem transferir: ${reason}`;
  logger.warn(message);
  Sentry.captureMessage(message, Sentry.Severity.Warning);
  await endFlow(ticket);
};

const evaluateCondition = (
  node: FlowNode,
  variables: Record<string, string>
): boolean => {
  const { variable, operator, value } = node.data;
  const current = variable ? variables[variable] : undefined;

  switch (operator) {
    case "exists":
      return current !== undefined && current !== "";
    case "eq":
      return current === value;
    case "neq":
      return current !== value;
    case "contains":
      return !!current && current.includes(value ?? "");
    case "gt":
      return Number(current) > Number(value);
    case "lt":
      return Number(current) < Number(value);
    default:
      return false;
  }
};

// Loop de auto-avanço: processa nodes "imediatos" (message, condition,
// transfer_*, end) em sequência; para em nodes de espera (question, menu,
// delay), persistindo onde o ticket ficou parado.
//
// Sub-funis (node "call_flow"): a pilha de retorno (flowCallStack) guarda,
// pra cada chamada em aberto, de qual flow e de qual node (o que vem depois
// do "call_flow" no funil chamador) continuar quando o funil chamado
// terminar num "end". O MAX_STEPS compartilhado entre todas as trocas de
// flow dentro de uma mesma chamada já limita recursão/loop entre funis
// (ex.: funil A chama B que chama A de novo).
const continueFrom = async (
  ticket: Ticket,
  initialFlow: Flow,
  startNodeId: string | null
): Promise<void> => {
  let flow = initialFlow;
  let currentNodeId = startNodeId;
  let steps = 0;
  const callStack = [...(ticket.flowCallStack ?? [])];

  while (currentNodeId) {
    steps += 1;
    if (steps > MAX_STEPS) {
      await endFlowAbnormally(
        ticket,
        `excedeu ${MAX_STEPS} passos no flow ${flow.id} (provável loop sem node de espera/transferência, ou funis se chamando em ciclo)`
      );
      return;
    }

    const node = findNode(flow.nodesJson, currentNodeId);
    if (!node) {
      await endFlowAbnormally(
        ticket,
        `node ${currentNodeId} não encontrado no flow ${flow.id} (apagado no editor mas ainda referenciado por uma edge)`
      );
      return;
    }

    switch (node.data.type) {
      case "start": {
        currentNodeId = findNextNodeId(flow.edgesJson, node.id);
        break;
      }

      case "message": {
        await sendText(ticket, node.data.text ?? "");
        currentNodeId = findNextNodeId(flow.edgesJson, node.id);
        break;
      }

      case "question": {
        await sendText(ticket, node.data.text ?? "");
        await ticket.update({ flowId: flow.id, flowNodeId: node.id, flowCallStack: callStack });
        return;
      }

      case "menu": {
        await sendMenuText(ticket, node);
        await ticket.update({ flowId: flow.id, flowNodeId: node.id, flowCallStack: callStack });
        return;
      }

      case "condition": {
        const result = evaluateCondition(node, ticket.flowVariables ?? {});
        currentNodeId = findNextNodeId(flow.edgesJson, node.id, result ? "true" : "false");
        break;
      }

      case "set_variable": {
        const variables = {
          ...(ticket.flowVariables ?? {}),
          [node.data.variable ?? node.id]: node.data.value ?? ""
        };
        await ticket.update({ flowVariables: variables });
        currentNodeId = findNextNodeId(flow.edgesJson, node.id);
        break;
      }

      case "tag_contact": {
        const changes: Record<string, string> = {};
        if (node.data.leadStatus) changes.leadStatus = node.data.leadStatus;
        if (node.data.pipelineStage) changes.pipelineStage = node.data.pipelineStage;
        if (Object.keys(changes).length > 0) {
          await Contact.update(changes, { where: { id: ticket.contactId } });
        }
        currentNodeId = findNextNodeId(flow.edgesJson, node.id);
        break;
      }

      case "delay": {
        const seconds = node.data.seconds ?? 0;
        await ticket.update({
          flowId: flow.id,
          flowNodeId: node.id,
          flowCallStack: callStack,
          flowResumeAt: new Date(Date.now() + seconds * 1000)
        });
        return;
      }

      case "transfer_queue": {
        if (node.data.queueId) {
          await assignTicketToQueue(ticket, node.data.queueId);
        }
        await endFlow(ticket);
        return;
      }

      case "transfer_agent": {
        if (node.data.transitionText) {
          await sendText(ticket, node.data.transitionText);
        }
        await ticket.update({ flowNodeId: null, aiAgentId: node.data.agentId });
        // Dispara o primeiro turno do agente de IA direto (sem esperar o
        // cliente mandar outra mensagem), para não deixá-lo esperando.
        await RunAiAgentTurnService(ticket, null);
        return;
      }

      case "call_flow": {
        const targetFlowId = node.data.calledFlowId;
        const targetFlow = targetFlowId
          ? await Flow.findByPk(targetFlowId)
          : null;

        if (!targetFlow) {
          await endFlowAbnormally(
            ticket,
            `node ${node.id} (call_flow) no flow ${flow.id} aponta pra um funil inexistente`
          );
          return;
        }

        const targetStartNode = targetFlow.nodesJson.find(n => n.data.type === "start");
        if (!targetStartNode) {
          await endFlowAbnormally(
            ticket,
            `funil ${targetFlow.id}, chamado pelo node ${node.id} do flow ${flow.id}, não tem node "start"`
          );
          return;
        }

        callStack.push({
          flowId: flow.id,
          returnNodeId: findNextNodeId(flow.edgesJson, node.id)
        });

        flow = targetFlow;
        currentNodeId = findNextNodeId(targetFlow.edgesJson, targetStartNode.id);
        break;
      }

      case "end": {
        const returnFrame = callStack.pop();
        if (returnFrame) {
          if (!returnFrame.returnNodeId) {
            // O node "call_flow" que chamou este funil não tinha edge de
            // saída configurada — o chamador termina aqui também, de
            // forma limpa (não é um erro de configuração).
            await endFlow(ticket);
            return;
          }

          const callerFlow = await Flow.findByPk(returnFrame.flowId);
          if (!callerFlow) {
            await endFlowAbnormally(
              ticket,
              `funil chamador ${returnFrame.flowId} não existe mais pra retornar a chamada`
            );
            return;
          }
          flow = callerFlow;
          currentNodeId = returnFrame.returnNodeId;
          break;
        }

        await endFlow(ticket);
        return;
      }

      default: {
        await endFlowAbnormally(
          ticket,
          `node ${node.id} tem tipo desconhecido "${node.data.type}" no flow ${flow.id}`
        );
        return;
      }
    }
  }

  // Saiu do loop sem cair em nenhum `return` explícito acima — um node
  // "start"/"message"/"condition" não tinha edge de saída configurada.
  await endFlowAbnormally(
    ticket,
    `node sem edge de saída configurada no flow ${flow.id}`
  );
};

// Usado pelo handler de mensagens para decidir se deve bufferizar fragmentos
// (nodes "question") ou responder na hora (nodes "menu").
export const getWaitingNodeType = async (
  ticket: Ticket
): Promise<string | null> => {
  if (!ticket.flowId || !ticket.flowNodeId) return null;

  const flow = await Flow.findByPk(ticket.flowId);
  if (!flow) return null;

  const node = findNode(flow.nodesJson, ticket.flowNodeId);
  return node?.data.type ?? null;
};

export const startFlow = async (ticket: Ticket, flowId: number): Promise<void> => {
  const flow = await Flow.findByPk(flowId);
  if (!flow) {
    const message = `Flow ${flowId} vinculado à conexão não existe mais (ticket ${ticket.id} ficou sem funil)`;
    logger.warn(message);
    Sentry.captureMessage(message, Sentry.Severity.Warning);
    return;
  }

  await ticket.update({ flowId, flowNodeId: null, flowVariables: {}, flowCallStack: [] });

  const startNode = flow.nodesJson.find(n => n.data.type === "start");
  if (!startNode) {
    const message = `Flow ${flowId} não tem node "start" — ticket ${ticket.id} entrou no funil mas não rodou nada`;
    logger.warn(message);
    Sentry.captureMessage(message, Sentry.Severity.Warning);
    return;
  }

  const firstNodeId = findNextNodeId(flow.edgesJson, startNode.id);
  await continueFrom(ticket, flow, firstNodeId);
};

// Chamado quando o cliente responde enquanto o ticket está parado num node
// "question" ou "menu" (ticket.flowNodeId apontando pra ele).
export const advanceFlow = async (
  ticket: Ticket,
  incomingBody: string
): Promise<void> => {
  if (!ticket.flowId || !ticket.flowNodeId) return;

  const flow = await Flow.findByPk(ticket.flowId);
  if (!flow) return;

  const node = findNode(flow.nodesJson, ticket.flowNodeId);
  if (!node) {
    await endFlow(ticket);
    return;
  }

  if (node.data.type === "question") {
    const variables = {
      ...(ticket.flowVariables ?? {}),
      [node.data.variableName ?? node.id]: incomingBody.trim()
    };
    await ticket.update({ flowVariables: variables });

    const nextId = findNextNodeId(flow.edgesJson, node.id);
    await continueFrom(ticket, flow, nextId);
    return;
  }

  if (node.data.type === "menu") {
    const options = node.data.options ?? [];
    const index = Number(incomingBody.trim()) - 1;
    const chosenOption = options[index];

    if (!chosenOption) {
      const resend = debounce(
        async () => {
          await sendMenuText(ticket, node);
        },
        3000,
        ticket.id
      );
      resend();
      return;
    }

    const variables = {
      ...(ticket.flowVariables ?? {}),
      [node.data.variableName ?? node.id]: chosenOption.value
    };
    await ticket.update({ flowVariables: variables });

    const nextId = findNextNodeId(flow.edgesJson, node.id, chosenOption.value);
    await continueFrom(ticket, flow, nextId);
    return;
  }

  // Ticket estava parado num tipo de node que não espera resposta de texto
  // (ex.: delay) — ignora o corpo recebido e só garante que o motor segue.
  await continueFrom(ticket, flow, node.id);
};

// Chamado só pelo job do cron (ProcessDueFlowDelaysJob), quando um node
// "delay" venceu.
export const resumeDelayedFlow = async (ticket: Ticket): Promise<void> => {
  if (!ticket.flowId || !ticket.flowNodeId) return;

  const flow = await Flow.findByPk(ticket.flowId);
  if (!flow) return;

  const node = findNode(flow.nodesJson, ticket.flowNodeId);
  if (!node || node.data.type !== "delay") {
    await ticket.update({ flowResumeAt: null });
    return;
  }

  await ticket.update({ flowResumeAt: null });

  const nextId = findNextNodeId(flow.edgesJson, node.id);
  await continueFrom(ticket, flow, nextId);
};
