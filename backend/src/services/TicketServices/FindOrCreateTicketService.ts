import { subHours } from "date-fns";
import { Op } from "sequelize";
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

const FindOrCreateTicketService = async (
  contact: Contact,
  whatsappId: number,
  unreadMessages: number,
  groupContact?: Contact
): Promise<Ticket> => {
  let ticket = await Ticket.findOne({
    where: {
      status: {
        [Op.or]: ["open", "pending"]
      },
      contactId: groupContact ? groupContact.id : contact.id,
      whatsappId: whatsappId
    }
  });

  if (ticket) {
    await ticket.update({ unreadMessages });
  }

  if (!ticket && groupContact) {
    ticket = await Ticket.findOne({
      where: {
        contactId: groupContact.id,
        whatsappId: whatsappId
      },
      order: [["updatedAt", "DESC"]]
    });

    if (ticket) {
      await ticket.update({
        status: "pending",
        userId: null,
        unreadMessages
      });
    }
  }

  if (!ticket && !groupContact) {
    ticket = await Ticket.findOne({
      where: {
        updatedAt: {
          [Op.between]: [+subHours(new Date(), 2), +new Date()]
        },
        contactId: contact.id,
        whatsappId: whatsappId
      },
      order: [["updatedAt", "DESC"]]
    });

    if (ticket) {
      const { status, userId } = await resolveAssignment(contact, ticket.queueId);
      await ticket.update({
        status,
        userId,
        unreadMessages
      });
    }
  }

  if (!ticket) {
    const { status, userId } = !groupContact
      ? await resolveAssignment(contact, null)
      : { status: "pending", userId: null };

    ticket = await Ticket.create({
      contactId: groupContact ? groupContact.id : contact.id,
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
