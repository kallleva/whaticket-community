import { logger } from "../../utils/logger";
import { sleep } from "../../utils/sleep";
import { decrypt } from "../../helpers/Encryption";
import { convertPcmToOggVoice, convertAudioFileToOggVoice } from "../../helpers/ConvertPcmToOggVoice";
import { synthesizeLocal } from "../../helpers/LocalSpeechProvider";
import { markdownToSpeech, markdownToWhatsapp } from "../../helpers/FormatReplyText";
import { whatsappProvider } from "../../providers/WhatsApp";
import Agent from "../../models/Agent";
import AiProvider from "../../models/AiProvider";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import assignTicketToQueue from "../FlowServices/AssignTicketToQueueHelper";
import generateGeminiReply, { ChatTurn } from "./providers/GeminiProvider";
import generateLocalReply from "./providers/LocalLlmProvider";
import SynthesizeSpeechService from "./SynthesizeSpeechService";
import { getToolsByKeys } from "./tools";

const HISTORY_LIMIT = 30;

// ~1s de "digitação" a cada 20 caracteres, entre 2s e 8s (mesma ideia do
// protótipo n8n do usuário).
const typingDelayFor = (length: number): number =>
  Math.min(8000, Math.max(2000, length * 50));

// Detecção determinística de "quero falar com humano" — não depende do
// modelo de IA lembrar de incluir o marcador de handoff no texto. Roda
// ANTES de chamar a IA, então garante que o agente realmente para de
// responder a partir daqui, mesmo se o modelo "esquecer" o marcador.
const HUMAN_HANDOFF_PATTERNS = [
  /falar\s+com\s+(um\s+)?(atendente|humano|pessoa|vendedor|alguém)/i,
  /quero\s+(um\s+)?(atendente|humano|vendedor)/i,
  /atendimento\s+humano/i,
  /me\s+(transfer[ei]|passa)\s+(pra|para)\s+(um\s+)?(atendente|humano|vendedor)/i,
  /não\s+quero\s+(falar\s+com\s+)?(rob[oô]|bot|ia)/i
];

const wantsHuman = (body: string | null): boolean =>
  !!body && HUMAN_HANDOFF_PATTERNS.some(pattern => pattern.test(body));

const handoffToFallbackQueue = async (ticket: Ticket, agent: Agent): Promise<void> => {
  const queueId = ticket.agentFallbackQueueId || agent.fallbackQueueId;

  await ticket.update({ aiAgentId: null, agentFallbackQueueId: null });

  if (queueId) {
    await assignTicketToQueue(ticket, queueId);
  }
};

const PLAIN_TEXT_RULE =
  "FORMATO DA RESPOSTA: escreva em texto simples, como numa conversa de WhatsApp. NÃO use Markdown: sem **negrito**, sem # títulos, sem listas com hífen ou asterisco, sem tabelas. Use frases curtas e naturais, como se estivesse falando.";

const buildSystemInstruction = (agent: Agent): string =>
  [
    agent.skillPrompt,
    agent.extraContext ? `--- Contexto adicional ---\n${agent.extraContext}` : "",
    PLAIN_TEXT_RULE
  ]
    .filter(Boolean)
    .join("\n\n");

const sendTextFragments = async (ticket: Ticket, replyText: string): Promise<void> => {
  const fragments = markdownToWhatsapp(replyText)
    .split(/\n{2,}/)
    .map(fragment => fragment.trim())
    .filter(Boolean);

  const chatId = `${ticket.contact.number}@c.us`;

  for (const fragment of fragments) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(typingDelayFor(fragment.length));

    try {
      // eslint-disable-next-line no-await-in-loop
      await whatsappProvider.sendMessage(ticket.whatsappId, chatId, fragment);
    } catch (error) {
      logger.error("Error sending AI agent fragment:", error);
    }
  }
};

// Melhor esforço: tenta sintetizar o texto completo em áudio e enviar como
// nota de voz. Primeiro tenta o Piper local (não depende de API externa);
// se não estiver disponível, cai pro TTS do Gemini; qualquer falha nos dois
// (ou no ffmpeg, ou no envio) cai de volta pra texto fragmentado — o
// cliente nunca fica sem resposta por causa disso.
const synthesizeVoice = async (text: string): Promise<Buffer | null> => {
  const spokenText = markdownToSpeech(text);
  const localWav = await synthesizeLocal(spokenText);
  if (localWav) {
    return convertAudioFileToOggVoice(localWav);
  }

  const tts = await SynthesizeSpeechService(spokenText);
  if (tts) {
    return convertPcmToOggVoice(tts.pcmBuffer, tts.sampleRateHz);
  }

  return null;
};

const sendVoiceReply = async (ticket: Ticket, replyText: string): Promise<void> => {
  try {
    const oggBuffer = await synthesizeVoice(replyText);
    if (!oggBuffer) {
      await sendTextFragments(ticket, replyText);
      return;
    }

    const chatId = `${ticket.contact.number}@c.us`;

    await whatsappProvider.sendMedia(
      ticket.whatsappId,
      chatId,
      { filename: "resposta.ogg", mimetype: "audio/ogg", data: oggBuffer },
      { sendAudioAsVoice: true }
    );
  } catch (error) {
    logger.error(error, "Error sending AI agent voice reply, falling back to text");
    await sendTextFragments(ticket, replyText);
  }
};

const RunAiAgentTurnService = async (
  ticket: Ticket,
  incomingBody: string | null
): Promise<void> => {
  const agent = await Agent.findByPk(ticket.aiAgentId);
  if (!agent) return;

  if (wantsHuman(incomingBody)) {
    await handoffToFallbackQueue(ticket, agent);
    return;
  }

  const aiProvider = await AiProvider.findOne();
  if (agent.providerType === "gemini" && !aiProvider?.apiKeyEncrypted) {
    logger.warn(
      `Ticket ${ticket.id}: nenhuma API key de IA configurada, transferindo para fallback`
    );
    await handoffToFallbackQueue(ticket, agent);
    return;
  }

  if (agent.providerType === "local" && !agent.apiUrl) {
    logger.warn(
      `Ticket ${ticket.id}: agente configurado como "local" sem apiUrl, transferindo para fallback`
    );
    await handoffToFallbackQueue(ticket, agent);
    return;
  }

  try {
    const messages = await Message.findAll({
      where: { ticketId: ticket.id },
      order: [["createdAt", "ASC"]],
      limit: HISTORY_LIMIT
    });

    const history: ChatTurn[] = messages
      .filter(message => !!message.body)
      .map(message => ({
        role: message.fromMe ? "assistant" : "user",
        content: message.body
      }));

    const systemInstruction = buildSystemInstruction(agent);
    const userMessage = incomingBody ?? "(conversa iniciada, dê as boas-vindas)";

    let replyText: string;

    if (agent.providerType === "local") {
      replyText = await generateLocalReply({
        apiUrl: agent.apiUrl,
        model: agent.model,
        systemInstruction,
        temperature: agent.temperature,
        history,
        message: userMessage
      });
    } else {
      const apiKey = decrypt(aiProvider!.apiKeyEncrypted);
      const tools = getToolsByKeys(agent.tools || []);

      replyText = await generateGeminiReply({
        apiKey,
        model: agent.model,
        systemInstruction,
        temperature: agent.temperature,
        history,
        message: userMessage,
        tools: tools.length > 0 ? tools : undefined,
        toolContext: tools.length > 0 ? { ticket } : undefined
      });
    }

    if (replyText.includes(agent.handoffMarker)) {
      await handoffToFallbackQueue(ticket, agent);
      return;
    }

    if (agent.voiceReplies) {
      await sendVoiceReply(ticket, replyText);
    } else {
      await sendTextFragments(ticket, replyText);
    }
  } catch (error) {
    logger.error("Error running AI agent turn:", error);
    await handoffToFallbackQueue(ticket, agent);
  }
};

export default RunAiAgentTurnService;
