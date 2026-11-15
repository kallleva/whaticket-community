import express from "express";
import isAuth from "../middleware/isAuth";

import * as ContactController from "../controllers/ContactController";
import * as ImportPhoneContactsController from "../controllers/ImportPhoneContactsController";

const contactRoutes = express.Router();

contactRoutes.post(
  "/contacts/import",
  isAuth,
  ImportPhoneContactsController.store
);

contactRoutes.get(
  "/contacts/ghosts",
  isAuth,
  ContactController.ghostsPreview
);

contactRoutes.delete(
  "/contacts/ghosts",
  isAuth,
  ContactController.ghostsDelete
);

contactRoutes.get("/contacts", isAuth, ContactController.index);

contactRoutes.get("/contacts/:contactId", isAuth, ContactController.show);

contactRoutes.post("/contacts", isAuth, ContactController.store);

contactRoutes.post("/contact", isAuth, ContactController.getContact);

contactRoutes.put("/contacts/:contactId", isAuth, ContactController.update);

contactRoutes.delete("/contacts/:contactId", isAuth, ContactController.remove);

contactRoutes.get(
  "/contacts/:contactId/notes",
  isAuth,
  ContactController.listNotes
);

contactRoutes.post(
  "/contacts/:contactId/notes",
  isAuth,
  ContactController.storeNote
);

contactRoutes.delete(
  "/contacts/:contactId/notes/:noteId",
  isAuth,
  ContactController.removeNote
);

export default contactRoutes;
