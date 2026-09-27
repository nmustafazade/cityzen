import { Router } from "express";
import { UserRole } from "@prisma/client";

import * as controller from "../controllers/municipal-content.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { parseContentImage } from "../middleware/upload.middleware";
import { listManagementDepartments } from "../services/department.service";

export const serviceRouter = Router().get("/", controller.listServices).get("/:id", controller.serviceById);
export const announcementRouter = Router().get("/", controller.listAnnouncements).get("/:id", controller.announcementById);
export const eventRouter = Router().get("/", controller.listEvents).get("/:id", controller.eventById);
export const publicDepartmentRouter = Router().get("/", async (_request, response, next) => {
  try { response.json({ departments: await listManagementDepartments() }); } catch (error) { next(error); }
});

const municipalityRouter = Router();
municipalityRouter.use(authenticate, authorizeRoles(UserRole.DEPARTMENT_HEAD, UserRole.ADMIN));
municipalityRouter.post("/:kind/:id/image", parseContentImage, controller.uploadImage);
municipalityRouter.get("/services", controller.managedServices).post("/services", controller.createService).patch("/services/:id", controller.updateService);
municipalityRouter.get("/announcements", controller.managedAnnouncements).post("/announcements", controller.createAnnouncement).patch("/announcements/:id", controller.updateAnnouncement);
municipalityRouter.get("/events", controller.managedEvents).post("/events", controller.createEvent).patch("/events/:id", controller.updateEvent);
export default municipalityRouter;
