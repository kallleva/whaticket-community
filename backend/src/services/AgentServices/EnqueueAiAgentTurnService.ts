import ShowTicketService from "../TicketServices/ShowTicketService";
import { bufferIncomingFragment } from "../../helpers/MessageFragmentBuffer";
import RunAiAgentTurnService from "./RunAiAgentTurnService";

// Janela de espera para juntar fragmentos de mensagem do cliente antes de
// mandar pra IA (mesma ideia do protótipo n8n do usuário, que esperava
// ~15s). Reduzida de 12s pra 6s a pedido — ainda dá tempo de juntar 2-3
// mensagens rápidas em sequência, mas sem pesar tanto na demora total da
// resposta.
const AI_BUFFER_WAIT_MS = 6000;

const EnqueueAiAgentTurnService = (ticketId: number, fragment: string): void => {
  bufferIncomingFragment(ticketId, fragment, AI_BUFFER_WAIT_MS, async joinedBody => {
    const ticket = await ShowTicketService(ticketId);

    if (!ticket.aiAgentId) return;

    await RunAiAgentTurnService(ticket, joinedBody);
  });
};

export default EnqueueAiAgentTurnService;
