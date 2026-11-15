import { Sequelize } from "sequelize-typescript";
import User from "../models/User";
import Setting from "../models/Setting";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import Whatsapp from "../models/Whatsapp";
import ContactCustomField from "../models/ContactCustomField";
import ContactNote from "../models/ContactNote";
import BirthdayMessageQueue from "../models/BirthdayMessageQueue";
import Message from "../models/Message";
import Queue from "../models/Queue";
import WhatsappQueue from "../models/WhatsappQueue";
import UserQueue from "../models/UserQueue";
import QuickAnswer from "../models/QuickAnswer";
import Reminder from "../models/Reminder";
import Flow from "../models/Flow";
import AiProvider from "../models/AiProvider";
import Agent from "../models/Agent";
import Vehicle from "../models/Vehicle";
import TestDrive from "../models/TestDrive";

// eslint-disable-next-line
const dbConfig = require("../config/database");
// import dbConfig from "../config/database";

const sequelize = new Sequelize(dbConfig);

const models = [
  User,
  Contact,
  Ticket,
  Message,
  Whatsapp,
  ContactCustomField,
  ContactNote,
  Setting,
  Queue,
  WhatsappQueue,
  UserQueue,
  QuickAnswer,
  Reminder,
  BirthdayMessageQueue,
  Flow,
  AiProvider,
  Agent,
  Vehicle,
  TestDrive
];

sequelize.addModels(models);

export default sequelize;
