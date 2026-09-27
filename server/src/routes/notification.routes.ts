import { Router } from "express";

import { index, markAllRead, markRead, unreadCount } from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

const notificationRouter = Router();

notificationRouter.use(authenticate);
notificationRouter.get("/", index);
notificationRouter.get("/unread-count", unreadCount);
notificationRouter.patch("/read-all", markAllRead);
notificationRouter.patch("/:id/read", markRead);

export default notificationRouter;
