import Reminder from "../../models/Reminder";

interface Request {
  userId: number;
  description: string;
  dueDate: Date;
  contactId?: number;
  ticketId?: number;
}

const CreateReminderService = async ({
  userId,
  description,
  dueDate,
  contactId,
  ticketId
}: Request): Promise<Reminder> => {
  const reminder = await Reminder.create({
    userId,
    description,
    dueDate,
    contactId,
    ticketId
  });

  await reminder.reload({ include: ["user", "contact", "ticket"] });

  return reminder;
};

export default CreateReminderService;
