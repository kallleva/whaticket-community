import ShowFlowService from "./ShowFlowService";

const DeleteFlowService = async (flowId: number | string): Promise<void> => {
  const flow = await ShowFlowService(flowId);

  await flow.destroy();
};

export default DeleteFlowService;
