import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import ListAgentsService from "../services/AgentServices/ListAgentsService";
import ShowAgentService from "../services/AgentServices/ShowAgentService";
import CreateAgentService from "../services/AgentServices/CreateAgentService";
import UpdateAgentService from "../services/AgentServices/UpdateAgentService";
import DeleteAgentService from "../services/AgentServices/DeleteAgentService";

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
  const { name, skillPrompt, model, temperature, handoffMarker, fallbackQueueId } =
    req.body;

  const agent = await CreateAgentService({
    name,
    skillPrompt,
    model,
    temperature,
    handoffMarker,
    fallbackQueueId
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
