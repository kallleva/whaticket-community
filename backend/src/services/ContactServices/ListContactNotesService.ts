import ContactNote from "../../models/ContactNote";

const ListContactNotesService = async (
  contactId: number
): Promise<ContactNote[]> => {
  const notes = await ContactNote.findAll({
    where: { contactId },
    include: ["user"],
    order: [["createdAt", "DESC"]]
  });

  return notes;
};

export default ListContactNotesService;
