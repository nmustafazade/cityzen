import { UserRole } from "@prisma/client";
import { Router } from "express";

import {
  assign,
  byId,
  cancel,
  changeStatus,
  create,
  index,
  myReports,
} from "../controllers/report.controller";
import { uploadImages } from "../controllers/report-image.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { parseReportImages } from "../middleware/upload.middleware";

const reportRouter = Router();

reportRouter.use(authenticate);

reportRouter.post("/", authorizeRoles(UserRole.CITIZEN), create);
reportRouter.get("/my", authorizeRoles(UserRole.CITIZEN), myReports);
reportRouter.get(
  "/",
  authorizeRoles(UserRole.EMPLOYEE, UserRole.ADMIN),
  index,
);
reportRouter.get("/:id", byId);
reportRouter.post(
  "/:id/images",
  authorizeRoles(UserRole.CITIZEN),
  parseReportImages,
  uploadImages,
);
reportRouter.patch("/:id/cancel", authorizeRoles(UserRole.CITIZEN), cancel);
reportRouter.patch(
  "/:id/status",
  authorizeRoles(UserRole.EMPLOYEE, UserRole.ADMIN),
  changeStatus,
);
reportRouter.patch(
  "/:id/assign",
  authorizeRoles(UserRole.EMPLOYEE, UserRole.ADMIN),
  assign,
);

export default reportRouter;
