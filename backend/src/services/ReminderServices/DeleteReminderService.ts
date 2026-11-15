import AppError from "../../errors/AppError";
import Reminder from "../../models/Reminder";

interface Request {
  reminderId: number;
  requestUser: { id: number; profile: string };
}

const DeleteReminderService = async ({
  reminderId,
  requestUser
}: Request): Promise<void> => {
  const reminder = await Reminder.findByPk(reminderId);

  if (!reminder) {
    throw new AppError("ERR_NO_REMINDER_FOUND", 404);
  }

  const isOwner = reminder.userId === requestUser.id;
  const isAdmin = requestUser.profile === "admin";

  if (!isOwner && !isAdmin) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  await reminder.destroy();
};

export default DeleteReminderService;
