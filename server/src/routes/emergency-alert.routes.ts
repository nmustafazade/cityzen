import { UserRole } from "@prisma/client";
import { Router } from "express";
import * as controller from "../controllers/emergency-alert.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
export const emergencyAlertRouter = Router();
emergencyAlertRouter.get("/", controller.list);
emergencyAlertRouter.get("/:id", controller.detail);
export const municipalityEmergencyAlertRouter = Router();
municipalityEmergencyAlertRouter.use(
  authenticate,
  authorizeRoles(UserRole.DEPARTMENT_HEAD, UserRole.ADMIN),
);
municipalityEmergencyAlertRouter.get("/", controller.managed);
municipalityEmergencyAlertRouter.post("/", controller.save);
municipalityEmergencyAlertRouter.patch("/:id", (r, s, n) => {
  r.body = { ...(r.body as object), id: r.params.id };
  void controller.save(r, s, n);
});
