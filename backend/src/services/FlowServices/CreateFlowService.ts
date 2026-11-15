import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Flow, { FlowNode, FlowEdge } from "../../models/Flow";

interface Request {
  name: string;
  whatsappId?: number;
  nodesJson?: FlowNode[];
  edgesJson?: FlowEdge[];
  userId?: number;
}

const CreateFlowService = async (flowData: Request): Promise<Flow> => {
  const schema = Yup.object().shape({
    name: Yup.string().min(2, "ERR_FLOW_INVALID_NAME").required("ERR_FLOW_INVALID_NAME")
  });

  try {
    await schema.validate({ name: flowData.name });
  } catch (err) {
    throw new AppError(err.message);
  }

  const flow = await Flow.create({
    name: flowData.name,
    whatsappId: flowData.whatsappId,
    nodesJson: flowData.nodesJson ?? [
      { id: "start", position: { x: 250, y: 50 }, data: { type: "start" } }
    ],
    edgesJson: flowData.edgesJson ?? [],
    updatedByUserId: flowData.userId
  });

  return flow;
};

export default CreateFlowService;
