import { Router } from "express";
import * as controller from "../controllers/public-report.controller";
const router = Router();
router.get("/", controller.list);
router.get("/:id/comments", controller.comments);
router.get("/:id", controller.detail);
export default router;
