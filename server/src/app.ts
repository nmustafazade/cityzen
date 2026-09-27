import cors from "cors";
import express from "express";
import path from "node:path";

import { errorHandler } from "./middleware/error.middleware";
import adminRouter from "./routes/admin.routes";
import authRouter from "./routes/auth.routes";
import healthRouter from "./routes/health.routes";
import managementRouter from "./routes/management.routes";
import notificationRouter from "./routes/notification.routes";
import reportCategoryRouter from "./routes/report-category.routes";
import reportRouter from "./routes/report.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "../uploads"), {
    dotfiles: "deny",
    setHeaders: (response) => response.setHeader("X-Content-Type-Options", "nosniff"),
  }),
);

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/management", managementRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/report-categories", reportCategoryRouter);
app.use("/api/reports", reportRouter);

app.use(errorHandler);

export default app;
