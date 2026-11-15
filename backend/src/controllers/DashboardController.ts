import { Request, Response } from "express";
import GetDashboardSummaryService from "../services/DashboardServices/GetDashboardSummaryService";

export const summary = async (req: Request, res: Response): Promise<Response> => {
  const data = await GetDashboardSummaryService({
    userId: +req.user.id,
    profile: req.user.profile
  });

  return res.status(200).json(data);
};
