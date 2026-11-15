import AppError from "../../errors/AppError";
import ContactNote from "../../models/ContactNote";

interface RequestUser {
  id: number;
  profile: string;
}

interface Request {
  noteId: number;
  requestUser: RequestUser;
}

const DeleteContactNoteService = async ({
  noteId,
  requestUser
}: Request): Promise<void> => {
  const note = await ContactNote.findByPk(noteId);

  if (!note) {
    throw new AppError("ERR_NO_CONTACT_NOTE_FOUND", 404);
  }

  const isAuthor = note.userId === requestUser.id;
  const isAdmin = requestUser.profile === "admin";

  if (!isAuthor && !isAdmin) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  await note.destroy();
};

export default DeleteContactNoteService;
