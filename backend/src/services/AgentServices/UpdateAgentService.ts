import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Agent from "../../models/Agent";
import ShowAgentService from "./ShowAgentService";

interface Request {
  name?: string;
  skillPrompt?: string;
  model?: string;
  temperature?: number;
  handoffMarker?: string;
  fallbackQueueId?: number | null;
}

const UpdateAgentService = async (
  agentId: number | string,
  agentData: Request
): Promise<Agent> => {
  const schema = Yup.object().shape({
    name: Yup.string().min(2, "ERR_AGENT_INVALID_NAME")
  });

  try {
    await schema.validate({ name: agentData.name });
  } catch (err) {
    throw new AppError(err.message);
  }

  const agent = await ShowAgentService(agentId);

  await agent.update({
    name: agentData.name ?? agent.name,
    skillPrompt: agentData.skillPrompt ?? agent.skillPrompt,
    model: agentData.model ?? agent.model,
    temperature: agentData.temperature ?? agent.temperature,
    handoffMarker: agentData.handoffMarker ?? agent.handoffMarker,
    fallbackQueueId:
      agentData.fallbackQueueId !== undefined
        ? agentData.fallbackQueueId
        : agent.fallbackQueueId
  });

  await agent.reload({ include: ["fallbackQueue"] });

  return agent;
};

export default UpdateAgentService;
