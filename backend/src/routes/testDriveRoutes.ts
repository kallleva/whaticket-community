import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as TestDriveController from "../controllers/TestDriveController";

const testDriveRoutes = Router();

testDriveRoutes.get("/test-drives", isAuth, TestDriveController.index);

testDriveRoutes.post("/test-drives", isAuth, TestDriveController.store);

testDriveRoutes.get("/test-drives/:testDriveId", isAuth, TestDriveController.show);

testDriveRoutes.put("/test-drives/:testDriveId", isAuth, TestDriveController.update);

testDriveRoutes.delete(
  "/test-drives/:testDriveId",
  isAuth,
  TestDriveController.remove
);

export default testDriveRoutes;
