import { logger } from "../../utils/logger";
import Whatsapp from "../../models/Whatsapp";
import Reminder from "../../models/Reminder";
import { whatsappProvider } from "../../providers/WhatsApp";

const sendReminderWhatsAppNotification = async (
  reminder: Reminder
): Promise<void> => {
  if (!reminder.user?.number) {
    return;
  }

  const whatsappId =
    reminder.ticket?.whatsappId ??
    (await Whatsapp.findOne({ where: { status: "CONNECTED" } }))?.id;

  if (!whatsappId) {
    return;
  }

  const body = `🔔 Lembrete: ${reminder.description}${
    reminder.contact ? ` (Contato: ${reminder.contact.name})` : ""
  }`;

  try {
    await whatsappProvider.sendMessage(
      whatsappId,
      `${reminder.user.number}@c.us`,
      body
    );
  } catch (error) {
    logger.error("Error sending reminder WhatsApp notification:", error);
  }
};

export default sendReminderWhatsAppNotification;
