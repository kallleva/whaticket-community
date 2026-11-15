import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import ListFlowsService from "../services/FlowServices/ListFlowsService";
import ShowFlowService from "../services/FlowServices/ShowFlowService";
import CreateFlowService from "../services/FlowServices/CreateFlowService";
import UpdateFlowService from "../services/FlowServices/UpdateFlowService";
import DeleteFlowService from "../services/FlowServices/DeleteFlowService";

type IndexQuery = {
  whatsappId?: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.query as IndexQuery;

  const flows = await ListFlowsService({ whatsappId });

  return res.status(200).json(flows);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { flowId } = req.params;

  const flow = await ShowFlowService(flowId);

  return res.status(200).json(flow);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { name, whatsappId, nodesJson, edgesJson } = req.body;

  const flow = await CreateFlowService({
    name,
    whatsappId,
    nodesJson,
    edgesJson,
    userId: +req.user.id
  });

  const io = getIO();
  io.emit("flow", { action: "update", flow });

  return res.status(200).json(flow);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { flowId } = req.params;

  const flow = await UpdateFlowService(flowId, req.body, +req.user.id);

  const io = getIO();
  io.emit("flow", { action: "update", flow });

  return res.status(200).json(flow);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { flowId } = req.params;

  await DeleteFlowService(flowId);

  const io = getIO();
  io.emit("flow", { action: "delete", flowId: +flowId });

  return res.status(200).send();
};
