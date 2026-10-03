import { UserRole } from "@prisma/client";
import { Router } from "express";

import { departments, employees } from "../controllers/management.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const managementRouter = Router();

managementRouter.use(
  authenticate,
  authorizeRoles(UserRole.DEPARTMENT_HEAD, UserRole.ADMIN),
);
managementRouter.get("/departments", departments);
managementRouter.get("/employees", employees);

export default managementRouter;
