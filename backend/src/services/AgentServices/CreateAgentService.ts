import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Agent from "../../models/Agent";

interface Request {
  name: string;
  skillPrompt: string;
  extraContext?: string;
  model: string;
  temperature?: number;
  handoffMarker?: string;
  fallbackQueueId?: number;
  providerType?: string;
  apiUrl?: string;
  tools?: string[];
  voiceReplies?: boolean;
}

const CreateAgentService = async (agentData: Request): Promise<Agent> => {
  const schema = Yup.object().shape({
    name: Yup.string().min(2, "ERR_AGENT_INVALID_NAME").required("ERR_AGENT_INVALID_NAME"),
    skillPrompt: Yup.string().required("ERR_AGENT_INVALID_SKILL"),
    model: Yup.string().required("ERR_AGENT_INVALID_MODEL")
  });

  try {
    await schema.validate(agentData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const agent = await Agent.create(agentData as any);

  return agent;
};

export default CreateAgentService;
