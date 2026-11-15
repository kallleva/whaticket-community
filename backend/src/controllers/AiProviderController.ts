import { Request, Response } from "express";

import ShowAiProviderService from "../services/AiProviderServices/ShowAiProviderService";
import UpdateAiProviderService from "../services/AiProviderServices/UpdateAiProviderService";

export const show = async (req: Request, res: Response): Promise<Response> => {
  const provider = await ShowAiProviderService();

  return res.status(200).json(provider);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { name, apiKey, enabledModels } = req.body;

  const provider = await UpdateAiProviderService({ name, apiKey, enabledModels });

  return res.status(200).json(provider);
};
