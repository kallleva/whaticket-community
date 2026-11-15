import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as VehicleController from "../controllers/VehicleController";

const vehicleRoutes = Router();

vehicleRoutes.get("/vehicles", isAuth, VehicleController.index);

vehicleRoutes.post("/vehicles", isAuth, VehicleController.store);

vehicleRoutes.get("/vehicles/:vehicleId", isAuth, VehicleController.show);

vehicleRoutes.put("/vehicles/:vehicleId", isAuth, VehicleController.update);

vehicleRoutes.delete("/vehicles/:vehicleId", isAuth, VehicleController.remove);

export default vehicleRoutes;
