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
import {
  comments,
  createComment,
  deleteComment,
  feedback,
  saveFeedback,
  toggleUpvote,
} from "../controllers/report-interaction.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { parseReportImages } from "../middleware/upload.middleware";

const reportRouter = Router();

reportRouter.use(authenticate);

reportRouter.post("/", authorizeRoles(UserRole.CITIZEN), create);
reportRouter.get("/my", authorizeRoles(UserRole.CITIZEN), myReports);
reportRouter.get(
  "/",
  authorizeRoles(UserRole.EMPLOYEE, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN),
  index,
);
reportRouter.get("/:id", byId);
reportRouter.get("/:id/comments", comments);
reportRouter.post("/:id/comments", createComment);
reportRouter.delete("/:reportId/comments/:commentId", deleteComment);
reportRouter.post("/:id/upvote", authorizeRoles(UserRole.CITIZEN), toggleUpvote);
reportRouter.get("/:id/feedback", feedback);
reportRouter.put("/:id/feedback", authorizeRoles(UserRole.CITIZEN), saveFeedback);
reportRouter.post(
  "/:id/images",
  authorizeRoles(UserRole.CITIZEN),
  parseReportImages,
  uploadImages,
);
reportRouter.patch("/:id/cancel", authorizeRoles(UserRole.CITIZEN), cancel);
reportRouter.patch(
  "/:id/status",
  authorizeRoles(UserRole.EMPLOYEE, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN),
  changeStatus,
);
reportRouter.patch(
  "/:id/assign",
  authorizeRoles(UserRole.DEPARTMENT_HEAD, UserRole.ADMIN),
  assign,
);

export default reportRouter;
