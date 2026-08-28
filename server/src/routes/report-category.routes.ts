import { Router } from "express";

import { categories } from "../controllers/report.controller";

const reportCategoryRouter = Router();

reportCategoryRouter.get("/", categories);

export default reportCategoryRouter;
