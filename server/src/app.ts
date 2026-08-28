import cors from "cors";
import express from "express";

import { errorHandler } from "./middleware/error.middleware";
import authRouter from "./routes/auth.routes";
import healthRouter from "./routes/health.routes";
import reportCategoryRouter from "./routes/report-category.routes";
import reportRouter from "./routes/report.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/report-categories", reportCategoryRouter);
app.use("/api/reports", reportRouter);

app.use(errorHandler);

export default app;
