import ShowAgentService from "./ShowAgentService";

const DeleteAgentService = async (agentId: number | string): Promise<void> => {
  const agent = await ShowAgentService(agentId);

  await agent.destroy();
};

export default DeleteAgentService;
