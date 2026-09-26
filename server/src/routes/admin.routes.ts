import { UserRole } from "@prisma/client";
import { Router } from "express";

import {
  categories,
  changeUserDepartment,
  changeUserRole,
  changeUserStatus,
  createCategoryHandler,
  createDepartmentHandler,
  departments,
  stats,
  updateCategoryHandler,
  updateDepartmentHandler,
  userById,
  users,
} from "../controllers/admin.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const adminRouter = Router();

adminRouter.use(authenticate, authorizeRoles(UserRole.ADMIN));
adminRouter.get("/stats", stats);
adminRouter.get("/departments", departments);
adminRouter.post("/departments", createDepartmentHandler);
adminRouter.patch("/departments/:id", updateDepartmentHandler);
adminRouter.get("/users", users);
adminRouter.get("/users/:id", userById);
adminRouter.patch("/users/:id/role", changeUserRole);
adminRouter.patch("/users/:id/status", changeUserStatus);
adminRouter.patch("/users/:id/department", changeUserDepartment);
adminRouter.get("/report-categories", categories);
adminRouter.post("/report-categories", createCategoryHandler);
adminRouter.patch("/report-categories/:id", updateCategoryHandler);

export default adminRouter;
