import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import { sleep } from "../../utils/sleep";
import Whatsapp from "../../models/Whatsapp";
import BirthdayMessageQueue from "../../models/BirthdayMessageQueue";
import { whatsappProvider } from "../../providers/WhatsApp";

interface Item {
  id: number;
  messageBody?: string;
}

const SendBirthdayMessageService = async (
  items: Item[],
  sentByUserId: number
): Promise<void> => {
  const connectedWhatsapp = await Whatsapp.findOne({
    where: { status: "CONNECTED" }
  });

  if (!connectedWhatsapp) {
    throw new AppError("ERR_NO_WHATSAPP_CONNECTED");
  }

  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    const entry = await BirthdayMessageQueue.findByPk(item.id, {
      include: ["contact"]
    });

    if (!entry || entry.status !== "pending") {
      continue;
    }

    const body = item.messageBody ?? entry.messageBody;

    try {
      // eslint-disable-next-line no-await-in-loop
      await whatsappProvider.sendMessage(
        connectedWhatsapp.id,
        `${entry.contact.number}@c.us`,
        body
      );

      // eslint-disable-next-line no-await-in-loop
      await entry.update({
        status: "sent",
        sentAt: new Date(),
        sentByUserId,
        messageBody: body
      });
    } catch (error) {
      logger.error("Error sending birthday message:", error);
    }

    // eslint-disable-next-line no-await-in-loop
    await sleep(1500);
  }
};

export default SendBirthdayMessageService;
