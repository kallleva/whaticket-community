import { Op, Filterable } from "sequelize";
import Reminder from "../../models/Reminder";

interface Request {
  userId: number;
  profile: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

const ListRemindersService = async ({
  userId,
  profile,
  status,
  startDate,
  endDate
}: Request): Promise<Reminder[]> => {
  const where: Exclude<Filterable["where"], undefined> = {};

  if (profile !== "admin") {
    where.userId = userId;
  }

  if (status) {
    where.status = status;
  }

  if (startDate && endDate) {
    where.dueDate = {
      [Op.between]: [+new Date(startDate), +new Date(endDate)]
    };
  }

  const reminders = await Reminder.findAll({
    where,
    include: ["user", "contact", "ticket"],
    order: [["dueDate", "ASC"]]
  });

  return reminders;
};

export default ListRemindersService;
