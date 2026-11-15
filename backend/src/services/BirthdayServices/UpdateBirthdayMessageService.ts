import AppError from "../../errors/AppError";
import BirthdayMessageQueue from "../../models/BirthdayMessageQueue";

interface Request {
  id: number;
  messageBody?: string;
  status?: string;
}

const UpdateBirthdayMessageService = async ({
  id,
  messageBody,
  status
}: Request): Promise<BirthdayMessageQueue> => {
  const entry = await BirthdayMessageQueue.findByPk(id);

  if (!entry) {
    throw new AppError("ERR_NO_BIRTHDAY_MESSAGE_FOUND", 404);
  }

  await entry.update({
    messageBody: messageBody ?? entry.messageBody,
    status: status ?? entry.status
  });

  await entry.reload({ include: ["contact", "sentByUser"] });

  return entry;
};

export default UpdateBirthdayMessageService;
