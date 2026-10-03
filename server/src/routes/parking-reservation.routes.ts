import { UserRole } from "@prisma/client";
import { Router } from "express";

import {
  cancel,
  create,
  detail,
  mine,
} from "../controllers/parking-reservation.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();
router.use(authenticate, authorizeRoles(UserRole.CITIZEN));
router.post("/", create);
router.get("/my", mine);
router.patch("/:id/cancel", cancel);
router.get("/:id", detail);
export default router;
