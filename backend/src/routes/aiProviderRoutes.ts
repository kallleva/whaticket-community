import { Router } from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";

import * as AiProviderController from "../controllers/AiProviderController";

const aiProviderRoutes = Router();

aiProviderRoutes.get(
  "/ai-settings",
  isAuth,
  isAdmin,
  AiProviderController.show
);

aiProviderRoutes.put(
  "/ai-settings",
  isAuth,
  isAdmin,
  AiProviderController.update
);

export default aiProviderRoutes;
