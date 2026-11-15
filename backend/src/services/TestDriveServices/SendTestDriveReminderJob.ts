import { Op, Filterable } from "sequelize";
import { logger } from "../../utils/logger";
import TestDrive from "../../models/TestDrive";
import {
  sendTestDriveMessageToContact,
  sendTestDriveMessageToSalesperson,
  formatTestDriveDate
} from "./sendTestDriveWhatsAppMessage";

const REMINDER_WINDOW_MS = 2 * 60 * 60 * 1000; // avisa 2h antes

const SendTestDriveReminderJob = async (): Promise<void> => {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

    const where: Exclude<Filterable["where"], undefined> = {
      status: { [Op.in]: ["scheduled", "confirmed"] },
      reminderSentAt: null,
      scheduledAt: { [Op.lte]: windowEnd, [Op.gte]: now }
    };

    const dueTestDrives = await TestDrive.findAll({
      where,
      include: ["contact", "vehicle", "user", "ticket"]
    });

    for (const testDrive of dueTestDrives) {
      const when = formatTestDriveDate(new Date(testDrive.scheduledAt));
      const vehicleText = testDrive.vehicle
        ? ` do ${testDrive.vehicle.brand} ${testDrive.vehicle.model}`
        : "";

      // eslint-disable-next-line no-await-in-loop
      await sendTestDriveMessageToContact(
        testDrive,
        `⏰ Lembrete: seu test-drive${vehicleText} é hoje às ${when}. Te esperamos!`
      );

      // eslint-disable-next-line no-await-in-loop
      await sendTestDriveMessageToSalesperson(
        testDrive,
        `⏰ Test-drive${vehicleText} com ${testDrive.contact?.name} marcado pra ${when}.`
      );

      // eslint-disable-next-line no-await-in-loop
      await testDrive.update({ reminderSentAt: now });
    }
  } catch (error) {
    logger.error("Error sending test drive reminders:", error);
  }
};

export default SendTestDriveReminderJob;
