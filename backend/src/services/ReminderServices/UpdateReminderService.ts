import AppError from "../../errors/AppError";
import Reminder from "../../models/Reminder";

interface Request {
  reminderId: number;
  description?: string;
  dueDate?: Date;
  status?: string;
  requestUser: { id: number; profile: string };
}

const UpdateReminderService = async ({
  reminderId,
  description,
  dueDate,
  status,
  requestUser
}: Request): Promise<Reminder> => {
  const reminder = await Reminder.findByPk(reminderId, {
    include: ["user", "contact", "ticket"]
  });

  if (!reminder) {
    throw new AppError("ERR_NO_REMINDER_FOUND", 404);
  }

  const isOwner = reminder.userId === requestUser.id;
  const isAdmin = requestUser.profile === "admin";

  if (!isOwner && !isAdmin) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  await reminder.update({
    description: description ?? reminder.description,
    dueDate: dueDate ?? reminder.dueDate,
    status: status ?? reminder.status,
    notifiedAt: status === "pending" ? null : reminder.notifiedAt
  });

  await reminder.reload({ include: ["user", "contact", "ticket"] });

  return reminder;
};

export default UpdateReminderService;
