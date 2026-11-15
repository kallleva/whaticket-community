import AppError from "../../errors/AppError";
import Flow from "../../models/Flow";

const ShowFlowService = async (flowId: number | string): Promise<Flow> => {
  const flow = await Flow.findByPk(flowId, {
    include: [
      { association: "whatsapp", attributes: ["id", "name"] },
      { association: "updatedByUser", attributes: ["id", "name"] }
    ]
  });

  if (!flow) {
    throw new AppError("ERR_FLOW_NOT_FOUND", 404);
  }

  return flow;
};

export default ShowFlowService;
