import ContactNote from "../../models/ContactNote";

interface Request {
  contactId: number;
  userId: number;
  note: string;
}

const CreateContactNoteService = async ({
  contactId,
  userId,
  note
}: Request): Promise<ContactNote> => {
  const contactNote = await ContactNote.create({ contactId, userId, note });

  await contactNote.reload({ include: ["user"] });

  return contactNote;
};

export default CreateContactNoteService;
