import { UserRole } from "@prisma/client";
import { Router } from "express";
import * as controller from "../controllers/ai.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
const router = Router();
router.use(authenticate);
router.post(
  "/reports/category-suggestion",
  authorizeRoles(UserRole.CITIZEN),
  controller.category,
);
router.post(
  "/reports/:id/priority-suggestion",
  authorizeRoles(UserRole.EMPLOYEE, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN),
  controller.priority,
);
router.post(
  "/reports/:id/summary",
  authorizeRoles(UserRole.EMPLOYEE, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN),
  controller.summary,
);
router.post(
  "/reports/:id/response-draft",
  authorizeRoles(UserRole.EMPLOYEE, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN),
  controller.reportDraft,
);
router.post(
  "/service-requests/:id/response-draft",
  authorizeRoles(UserRole.EMPLOYEE, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN),
  controller.serviceDraft,
);
router.post(
  "/analytics/summary",
  authorizeRoles(UserRole.DEPARTMENT_HEAD, UserRole.ADMIN),
  controller.analytics,
);
export default router;
