import { logger } from "../../utils/logger";
import { sleep } from "../../utils/sleep";
import { decrypt } from "../../helpers/Encryption";
import { whatsappProvider } from "../../providers/WhatsApp";
import Agent from "../../models/Agent";
import AiProvider from "../../models/AiProvider";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import assignTicketToQueue from "../FlowServices/AssignTicketToQueueHelper";
import generateReply from "./providers/GeminiProvider";

const HISTORY_LIMIT = 30;

// ~1s de "digitação" a cada 20 caracteres, entre 2s e 8s (mesma ideia do
// protótipo n8n do usuário).
const typingDelayFor = (length: number): number =>
  Math.min(8000, Math.max(2000, length * 50));

const handoffToFallbackQueue = async (
  ticket: Ticket,
  agent: Agent
): Promise<void> => {
  await ticket.update({ aiAgentId: null });

  if (agent.fallbackQueueId) {
    await assignTicketToQueue(ticket, agent.fallbackQueueId);
  }
};

const RunAiAgentTurnService = async (
  ticket: Ticket,
  incomingBody: string | null
): Promise<void> => {
  const agent = await Agent.findByPk(ticket.aiAgentId);
  if (!agent) return;

  const aiProvider = await AiProvider.findOne();
  if (!aiProvider?.apiKeyEncrypted) {
    logger.warn(
      `Ticket ${ticket.id}: nenhuma API key de IA configurada, transferindo para fallback`
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

    const history = messages
      .filter(message => !!message.body)
      .map(message => ({
        role: message.fromMe ? "model" : "user",
        parts: [{ text: message.body }]
      }));

    const apiKey = decrypt(aiProvider.apiKeyEncrypted);

    const replyText = await generateReply({
      apiKey,
      model: agent.model,
      systemInstruction: agent.skillPrompt,
      temperature: agent.temperature,
      history,
      message: incomingBody ?? "(conversa iniciada, dê as boas-vindas)"
    });

    if (replyText.includes(agent.handoffMarker)) {
      await handoffToFallbackQueue(ticket, agent);
      return;
    }

    const fragments = replyText
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
  } catch (error) {
    logger.error("Error running AI agent turn:", error);
    await handoffToFallbackQueue(ticket, agent);
  }
};

export default RunAiAgentTurnService;
