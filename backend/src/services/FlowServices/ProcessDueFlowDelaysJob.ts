import { Op, Filterable } from "sequelize";
import { logger } from "../../utils/logger";
import Ticket from "../../models/Ticket";
import ShowTicketService from "../TicketServices/ShowTicketService";
import { resumeDelayedFlow } from "./AdvanceFlowService";

const ProcessDueFlowDelaysJob = async (): Promise<void> => {
  try {
    const where: Exclude<Filterable["where"], undefined> = {
      flowId: { [Op.not]: null } as unknown as number,
      flowResumeAt: { [Op.lte]: new Date() }
    };

    const dueTickets = await Ticket.findAll({ where });

    for (const dueTicket of dueTickets) {
      // eslint-disable-next-line no-await-in-loop
      const ticket = await ShowTicketService(dueTicket.id);
      // eslint-disable-next-line no-await-in-loop
      await resumeDelayedFlow(ticket);
    }
  } catch (error) {
    logger.error("Error processing due flow delays:", error);
  }
};

export default ProcessDueFlowDelaysJob;
