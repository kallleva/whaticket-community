import Queue from "../../models/Queue";
import Ticket from "../../models/Ticket";
import getNextUserForQueue from "../UserServices/RoundRobinService";
import UpdateTicketService from "../TicketServices/UpdateTicketService";

const assignTicketToQueue = async (
  ticket: Ticket,
  queueId: number
): Promise<void> => {
  const queue = await Queue.findByPk(queueId, { include: ["users"] });
  const nextUser = queue ? await getNextUserForQueue(queue.users) : null;

  await UpdateTicketService({
    ticketData: {
      queueId,
      userId: nextUser ? nextUser.id : null,
      status: nextUser ? "open" : "pending"
    },
    ticketId: ticket.id
  });
};

export default assignTicketToQueue;
