import express from "express";
import isAuth from "../middleware/isAuth";

import * as DashboardController from "../controllers/DashboardController";

const dashboardRoutes = express.Router();

dashboardRoutes.get("/dashboard/summary", isAuth, DashboardController.summary);

export default dashboardRoutes;
