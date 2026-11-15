import { Request, Response } from "express";

import CreateReminderService from "../services/ReminderServices/CreateReminderService";
import ListRemindersService from "../services/ReminderServices/ListRemindersService";
import UpdateReminderService from "../services/ReminderServices/UpdateReminderService";
import DeleteReminderService from "../services/ReminderServices/DeleteReminderService";

type IndexQuery = {
  status?: string;
  startDate?: string;
  endDate?: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { status, startDate, endDate } = req.query as IndexQuery;

  const reminders = await ListRemindersService({
    userId: Number(req.user.id),
    profile: req.user.profile,
    status,
    startDate,
    endDate
  });

  return res.status(200).json(reminders);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { description, dueDate, contactId, ticketId } = req.body;

  const reminder = await CreateReminderService({
    userId: Number(req.user.id),
    description,
    dueDate,
    contactId,
    ticketId
  });

  return res.status(200).json(reminder);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { reminderId } = req.params;
  const { description, dueDate, status } = req.body;

  const reminder = await UpdateReminderService({
    reminderId: Number(reminderId),
    description,
    dueDate,
    status,
    requestUser: {
      id: Number(req.user.id),
      profile: req.user.profile
    }
  });

  return res.status(200).json(reminder);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { reminderId } = req.params;

  await DeleteReminderService({
    reminderId: Number(reminderId),
    requestUser: {
      id: Number(req.user.id),
      profile: req.user.profile
    }
  });

  return res.status(200).json({ message: "Reminder deleted" });
};
