import { Request, Response } from "express";

import ListBirthdayMessagesService from "../services/BirthdayServices/ListBirthdayMessagesService";
import UpdateBirthdayMessageService from "../services/BirthdayServices/UpdateBirthdayMessageService";
import SendBirthdayMessageService from "../services/BirthdayServices/SendBirthdayMessageService";

type IndexQuery = {
  status?: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { status } = req.query as IndexQuery;

  const entries = await ListBirthdayMessagesService({ status });

  return res.status(200).json(entries);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const { messageBody, status } = req.body;

  const entry = await UpdateBirthdayMessageService({
    id: Number(id),
    messageBody,
    status
  });

  return res.status(200).json(entry);
};

export const send = async (req: Request, res: Response): Promise<Response> => {
  const { items } = req.body;

  await SendBirthdayMessageService(items, Number(req.user.id));

  return res.status(200).json({ message: "Birthday messages sent" });
};
