import { Filterable } from "sequelize";
import Flow from "../../models/Flow";

interface Request {
  whatsappId?: string | number;
}

const ListFlowsService = async ({ whatsappId }: Request = {}): Promise<Flow[]> => {
  const where: Exclude<Filterable["where"], undefined> = whatsappId
    ? { whatsappId }
    : {};

  const flows = await Flow.findAll({
    where,
    include: [
      { association: "whatsapp", attributes: ["id", "name"] },
      { association: "updatedByUser", attributes: ["id", "name"] }
    ],
    order: [["name", "ASC"]]
  });

  return flows;
};

export default ListFlowsService;
