import Contact from "../../models/Contact";
import Queue from "../../models/Queue";
import Ticket from "../../models/Ticket";
import ShowTicketService from "./ShowTicketService";
import getNextUserForQueue from "../UserServices/RoundRobinService";

const reassignUserForQueue = async (
  queueId: number | null
): Promise<{ status: string; userId: number | null }> => {
  if (!queueId) {
    return { status: "pending", userId: null };
  }

  const queue = await Queue.findByPk(queueId, { include: ["users"] });
  const nextUser = queue ? await getNextUserForQueue(queue.users) : null;

  return {
    status: nextUser ? "open" : "pending",
    userId: nextUser ? nextUser.id : null
  };
};

// "Carteira de cliente": se o contato já tem um vendedor dono (atribuído da
// primeira vez que alguém assumiu um ticket dele — ver UpdateTicketService),
// toda mensagem nova cai direto pra ele, sem round robin e sem passar pelo
// funil/menu de filas — mesmo que o ticket anterior já tenha sido resolvido.
const resolveAssignment = async (
  contact: Contact,
  queueId: number | null
): Promise<{ status: string; userId: number | null }> => {
  if (contact.ownerId) {
    return { status: "open", userId: contact.ownerId };
  }

  return reassignUserForQueue(queueId);
};

// Um contato (número) tem UM único ticket, pra sempre — o histórico inteiro
// da conversa fica num lugar só, independente de status, de quanto tempo
// passou ou de qual conexão a mensagem chegou. Se o ticket estava resolvido
// ("closed"), ele é reaberto (e o funil/agente de IA são resetados pra
// cliente voltar a ser atendido do começo, ou direto pro dono da carteira).
const FindOrCreateTicketService = async (
  contact: Contact,
  whatsappId: number,
  unreadMessages: number,
  groupContact?: Contact
): Promise<Ticket> => {
  const ticketContactId = groupContact ? groupContact.id : contact.id;

  // order: caso ainda existam duplicados antigos (anteriores à migration que
  // unificou os tickets), usa sempre o mais recentemente atualizado.
  let ticket = await Ticket.findOne({
    where: { contactId: ticketContactId },
    order: [["updatedAt", "DESC"]]
  });

  if (ticket) {
    const changes: Record<string, unknown> = { unreadMessages, whatsappId };

    if (ticket.status === "closed") {
      if (groupContact) {
        changes.status = "pending";
        changes.userId = null;
      } else {
        const { status, userId } = await resolveAssignment(contact, null);
        changes.status = status;
        changes.userId = userId;
        changes.queueId = null;
      }

      changes.flowId = null;
      changes.flowNodeId = null;
      changes.flowResumeAt = null;
      changes.flowCallStack = [];
      changes.flowVariables = {};
      changes.aiAgentId = null;
      changes.agentFallbackQueueId = null;
    }

    await ticket.update(changes);
  } else {
    const { status, userId } = !groupContact
      ? await resolveAssignment(contact, null)
      : { status: "pending", userId: null };

    ticket = await Ticket.create({
      contactId: ticketContactId,
      status,
      userId,
      isGroup: !!groupContact,
      unreadMessages,
      whatsappId
    });
  }

  ticket = await ShowTicketService(ticket.id);

  return ticket;
};

export default FindOrCreateTicketService;
