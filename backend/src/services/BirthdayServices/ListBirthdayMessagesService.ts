import { Filterable } from "sequelize";
import BirthdayMessageQueue from "../../models/BirthdayMessageQueue";

interface Request {
  status?: string;
}

const ListBirthdayMessagesService = async ({
  status
}: Request): Promise<BirthdayMessageQueue[]> => {
  const where: Exclude<Filterable["where"], undefined> = {};

  if (status) {
    where.status = status;
  }

  const entries = await BirthdayMessageQueue.findAll({
    where,
    include: ["contact", "sentByUser"],
    order: [["createdAt", "DESC"]]
  });

  return entries;
};

export default ListBirthdayMessagesService;
