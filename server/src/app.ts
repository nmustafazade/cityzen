import cors from "cors";
import express from "express";
import path from "node:path";

import { errorHandler } from "./middleware/error.middleware";
import adminRouter from "./routes/admin.routes";
import authRouter from "./routes/auth.routes";
import healthRouter from "./routes/health.routes";
import managementRouter from "./routes/management.routes";
import notificationRouter from "./routes/notification.routes";
import municipalityRouter, { announcementRouter, eventRouter, publicDepartmentRouter, serviceRouter } from "./routes/municipal-content.routes";
import reportCategoryRouter from "./routes/report-category.routes";
import reportRouter from "./routes/report.routes";
import { municipalityServiceRequestRouter, serviceRequestRouter } from "./routes/service-request.routes";
import { facilityCategoryAdminRouter, infrastructureRouter, municipalityInfrastructureRouter } from "./routes/infrastructure.routes";
import parkingReservationRouter from "./routes/parking-reservation.routes";
import { municipalityWasteRouter, wasteRouter } from "./routes/waste.routes";
import { environmentRouter, municipalityEnvironmentRouter, weatherRouter } from "./routes/environment.routes";
import { emergencyAlertRouter, municipalityEmergencyAlertRouter } from "./routes/emergency-alert.routes";
import publicReportRouter from"./routes/public-report.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(
  "/uploads",
  (request,response,next)=>request.path.startsWith("/service-requests/")?response.status(404).json({status:"error",message:"Not found"}):next(),
  express.static(path.resolve(__dirname, "../uploads"), {
    dotfiles: "deny",
    setHeaders: (response) => response.setHeader("X-Content-Type-Options", "nosniff"),
  }),
);

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin/facility-categories", facilityCategoryAdminRouter);
app.use("/api/management", managementRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/services", serviceRouter);
app.use("/api/announcements", announcementRouter);
app.use("/api/events", eventRouter);
app.use("/api/departments", publicDepartmentRouter);
app.use("/api/municipality/service-requests", municipalityServiceRequestRouter);
app.use("/api/municipality/infrastructure", municipalityInfrastructureRouter);
app.use("/api/municipality", municipalityRouter);
app.use("/api/report-categories", reportCategoryRouter);
app.use("/api/public/reports",publicReportRouter);
app.use("/api/reports", reportRouter);
app.use("/api/service-requests", serviceRequestRouter);
app.use("/api/infrastructure", infrastructureRouter);
app.use("/api/parking-reservations", parkingReservationRouter);
app.use("/api/waste", wasteRouter);
app.use("/api/environment", environmentRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/emergency-alerts", emergencyAlertRouter);
app.use("/api/municipality/waste", municipalityWasteRouter);
app.use("/api/municipality/environment", municipalityEnvironmentRouter);
app.use("/api/municipality/emergency-alerts", municipalityEmergencyAlertRouter);

app.use(errorHandler);

export default app;
