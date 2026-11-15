import { Op } from "sequelize";
import { getIO } from "../../libs/socket";
import { logger } from "../../utils/logger";
import Reminder from "../../models/Reminder";
import sendReminderWhatsAppNotification from "./sendReminderWhatsAppNotification";

const CheckDueRemindersJob = async (): Promise<void> => {
  try {
    const dueReminders = await Reminder.findAll({
      where: {
        status: "pending",
        notifiedAt: null,
        dueDate: { [Op.lte]: new Date() }
      },
      include: ["user", "contact", "ticket"]
    });

    if (dueReminders.length === 0) {
      return;
    }

    const io = getIO();

    for (const reminder of dueReminders) {
      io.to(`user_${reminder.userId}`).emit("reminder", {
        action: "due",
        reminder
      });

      // eslint-disable-next-line no-await-in-loop
      await sendReminderWhatsAppNotification(reminder);

      // eslint-disable-next-line no-await-in-loop
      await reminder.update({ notifiedAt: new Date() });
    }
  } catch (error) {
    logger.error("Error checking due reminders:", error);
  }
};

export default CheckDueRemindersJob;
