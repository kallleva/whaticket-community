import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import ListAgentsService from "../services/AgentServices/ListAgentsService";
import ShowAgentService from "../services/AgentServices/ShowAgentService";
import CreateAgentService from "../services/AgentServices/CreateAgentService";
import UpdateAgentService from "../services/AgentServices/UpdateAgentService";
import DeleteAgentService from "../services/AgentServices/DeleteAgentService";
import { AVAILABLE_TOOLS } from "../services/AgentServices/tools";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const agents = await ListAgentsService();

  return res.status(200).json(agents);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { agentId } = req.params;

  const agent = await ShowAgentService(agentId);

  return res.status(200).json(agent);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    name,
    skillPrompt,
    extraContext,
    model,
    temperature,
    handoffMarker,
    fallbackQueueId,
    providerType,
    apiUrl,
    tools,
    voiceReplies
  } = req.body;

  const agent = await CreateAgentService({
    name,
    skillPrompt,
    extraContext,
    model,
    temperature,
    handoffMarker,
    fallbackQueueId,
    providerType,
    apiUrl,
    tools,
    voiceReplies
  });

  const io = getIO();
  io.emit("agent", { action: "update", agent });

  return res.status(200).json(agent);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { agentId } = req.params;

  const agent = await UpdateAgentService(agentId, req.body);

  const io = getIO();
  io.emit("agent", { action: "update", agent });

  return res.status(200).json(agent);
};

export const listTools = async (req: Request, res: Response): Promise<Response> => {
  const tools = AVAILABLE_TOOLS.map(tool => ({ key: tool.key, label: tool.label }));

  return res.status(200).json(tools);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { agentId } = req.params;

  await DeleteAgentService(agentId);

  const io = getIO();
  io.emit("agent", { action: "delete", agentId: +agentId });

  return res.status(200).send();
};
