import { UserRole } from "@prisma/client";
import { Router } from "express";
import * as controller from "../controllers/analytics.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
const router = Router();
router.use(
  authenticate,
  authorizeRoles(UserRole.DEPARTMENT_HEAD, UserRole.ADMIN),
);
router.get("/overview", controller.overview);
router.get("/reports", controller.reports);
router.get("/service-requests", controller.serviceRequests);
router.get("/feedback", controller.feedback);
router.get("/workload", controller.workload);
router.get("/trends", controller.trends);
router.get("/geography", controller.geography);
router.get("/infrastructure", controller.infrastructure);
router.get("/export", controller.csv);
export default router;
