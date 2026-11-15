import { Router } from "express";

import userRoutes from "./userRoutes";
import authRoutes from "./authRoutes";
import settingRoutes from "./settingRoutes";
import contactRoutes from "./contactRoutes";
import ticketRoutes from "./ticketRoutes";
import whatsappRoutes from "./whatsappRoutes";
import messageRoutes from "./messageRoutes";
import whatsappSessionRoutes from "./whatsappSessionRoutes";
import queueRoutes from "./queueRoutes";
import quickAnswerRoutes from "./quickAnswerRoutes";
import reminderRoutes from "./reminderRoutes";
import birthdayRoutes from "./birthdayRoutes";
import flowRoutes from "./flowRoutes";
import aiProviderRoutes from "./aiProviderRoutes";
import agentRoutes from "./agentRoutes";
import vehicleRoutes from "./vehicleRoutes";
import testDriveRoutes from "./testDriveRoutes";
import dashboardRoutes from "./dashboardRoutes";
import apiRoutes from "./apiRoutes";

const routes = Router();

routes.use(userRoutes);
routes.use("/auth", authRoutes);
routes.use(settingRoutes);
routes.use(contactRoutes);
routes.use(ticketRoutes);
routes.use(whatsappRoutes);
routes.use(messageRoutes);
routes.use(whatsappSessionRoutes);
routes.use(queueRoutes);
routes.use(quickAnswerRoutes);
routes.use(reminderRoutes);
routes.use(birthdayRoutes);
routes.use(flowRoutes);
routes.use(aiProviderRoutes);
routes.use(agentRoutes);
routes.use(vehicleRoutes);
routes.use(testDriveRoutes);
routes.use(dashboardRoutes);
routes.use("/api/messages", apiRoutes);

export default routes;
