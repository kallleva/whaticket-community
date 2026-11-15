import express from "express";
import isAuth from "../middleware/isAuth";

import * as ReminderController from "../controllers/ReminderController";

const reminderRoutes = express.Router();

reminderRoutes.get("/reminders", isAuth, ReminderController.index);

reminderRoutes.post("/reminders", isAuth, ReminderController.store);

reminderRoutes.put(
  "/reminders/:reminderId",
  isAuth,
  ReminderController.update
);

reminderRoutes.delete(
  "/reminders/:reminderId",
  isAuth,
  ReminderController.remove
);

export default reminderRoutes;
