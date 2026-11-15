import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Flow, { FlowNode, FlowEdge } from "../../models/Flow";
import ShowFlowService from "./ShowFlowService";

interface Request {
  name?: string;
  status?: string;
  whatsappId?: number;
  nodesJson?: FlowNode[];
  edgesJson?: FlowEdge[];
}

const UpdateFlowService = async (
  flowId: number | string,
  flowData: Request,
  userId?: number
): Promise<Flow> => {
  const schema = Yup.object().shape({
    name: Yup.string().min(2, "ERR_FLOW_INVALID_NAME")
  });

  try {
    await schema.validate({ name: flowData.name });
  } catch (err) {
    throw new AppError(err.message);
  }

  if (
    flowData.nodesJson &&
    !flowData.nodesJson.some(n => n.data?.type === "start")
  ) {
    throw new AppError("ERR_FLOW_MISSING_START_NODE");
  }

  const flow = await ShowFlowService(flowId);

  await flow.update({
    ...flowData,
    updatedByUserId: userId ?? flow.updatedByUserId
  });
  await flow.reload({
    include: [
      { association: "whatsapp", attributes: ["id", "name"] },
      { association: "updatedByUser", attributes: ["id", "name"] }
    ]
  });

  return flow;
};

export default UpdateFlowService;
