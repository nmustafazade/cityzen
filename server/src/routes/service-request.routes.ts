import { UserRole } from "@prisma/client";
import { Router } from "express";
import {
  assign,
  cancel,
  changeStatus,
  create,
  detail,
  managed,
  mine,
  uploadDocumentsController,
  downloadDocument,
} from "../controllers/service-request.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { parseServiceDocuments } from "../middleware/upload.middleware";

export const serviceRequestRouter = Router();
serviceRequestRouter.use(authenticate);
serviceRequestRouter.post("/", authorizeRoles(UserRole.CITIZEN), create);
serviceRequestRouter.get("/my", authorizeRoles(UserRole.CITIZEN), mine);
serviceRequestRouter.patch(
  "/:id/cancel",
  authorizeRoles(UserRole.CITIZEN),
  cancel,
);
serviceRequestRouter.patch(
  "/:id/assign",
  authorizeRoles(UserRole.DEPARTMENT_HEAD, UserRole.ADMIN),
  assign,
);
serviceRequestRouter.patch(
  "/:id/status",
  authorizeRoles(UserRole.EMPLOYEE, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN),
  changeStatus,
);
serviceRequestRouter.post(
  "/:id/documents",
  parseServiceDocuments,
  uploadDocumentsController,
);
serviceRequestRouter.get("/:id/documents/:documentId", downloadDocument);
serviceRequestRouter.get("/:id", detail);

export const municipalityServiceRequestRouter = Router();
municipalityServiceRequestRouter.use(
  authenticate,
  authorizeRoles(UserRole.EMPLOYEE, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN),
);
municipalityServiceRequestRouter.get("/", managed);
