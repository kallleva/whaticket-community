import express from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";

import * as BirthdayMessageController from "../controllers/BirthdayMessageController";

const birthdayRoutes = express.Router();

birthdayRoutes.get(
  "/birthday-messages",
  isAuth,
  isAdmin,
  BirthdayMessageController.index
);

birthdayRoutes.put(
  "/birthday-messages/:id",
  isAuth,
  isAdmin,
  BirthdayMessageController.update
);

birthdayRoutes.post(
  "/birthday-messages/send",
  isAuth,
  isAdmin,
  BirthdayMessageController.send
);

export default birthdayRoutes;
