import AppError from "../../errors/AppError";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import ShowContactService from "../ContactServices/ShowContactService";

interface Request {
  contactId: number;
  status: string;
  userId: number;
  queueId?: number;
}

// Um contato tem um único ticket, pra sempre (ver FindOrCreateTicketService):
// se já existe, ele é reaproveitado — reaberto e atribuído a quem pediu se
// estava resolvido — em vez de criar um segundo ticket pro mesmo número.
const CreateTicketService = async ({
  contactId,
  status,
  userId,
  queueId
}: Request): Promise<Ticket> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(userId);

  const existing = await Ticket.findOne({
    where: { contactId },
    order: [["updatedAt", "DESC"]]
  });

  if (existing) {
    if (existing.status === "closed") {
      await existing.update({
        status,
        userId,
        whatsappId: defaultWhatsapp.id,
        flowId: null,
        flowNodeId: null,
        flowResumeAt: null,
        flowCallStack: [],
        flowVariables: {},
        aiAgentId: null,
        agentFallbackQueueId: null
      });
    }

    const reused = await Ticket.findByPk(existing.id, { include: ["contact"] });
    if (!reused) {
      throw new AppError("ERR_CREATING_TICKET");
    }

    return reused;
  }

  const { isGroup } = await ShowContactService(contactId);

  if (queueId === undefined) {
    const user = await User.findByPk(userId, { include: ["queues"] });
    queueId = user?.queues.length === 1 ? user.queues[0].id : undefined;
  }

  const { id }: Ticket = await defaultWhatsapp.$create("ticket", {
    contactId,
    status,
    isGroup,
    userId,
    queueId
  });

  const ticket = await Ticket.findByPk(id, { include: ["contact"] });

  if (!ticket) {
    throw new AppError("ERR_CREATING_TICKET");
  }

  return ticket;
};

export default CreateTicketService;
