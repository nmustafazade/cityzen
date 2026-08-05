import { Router } from "express";

import {
  getApiHealth,
  getDatabaseHealth,
} from "../controllers/health.controller";

const healthRouter = Router();

healthRouter.get("/", getApiHealth);
healthRouter.get("/database", getDatabaseHealth);

export default healthRouter;
