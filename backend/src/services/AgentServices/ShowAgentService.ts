import AppError from "../../errors/AppError";
import Agent from "../../models/Agent";

const ShowAgentService = async (agentId: number | string): Promise<Agent> => {
  const agent = await Agent.findByPk(agentId, { include: ["fallbackQueue"] });

  if (!agent) {
    throw new AppError("ERR_AGENT_NOT_FOUND", 404);
  }

  return agent;
};

export default ShowAgentService;
