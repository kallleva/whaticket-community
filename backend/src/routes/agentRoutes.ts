import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as AgentController from "../controllers/AgentController";

const agentRoutes = Router();

agentRoutes.get("/agents", isAuth, AgentController.index);

agentRoutes.post("/agents", isAuth, AgentController.store);

agentRoutes.get("/agents/:agentId", isAuth, AgentController.show);

agentRoutes.put("/agents/:agentId", isAuth, AgentController.update);

agentRoutes.delete("/agents/:agentId", isAuth, AgentController.remove);

export default agentRoutes;
