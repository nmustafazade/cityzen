import cors from "cors";
import express from "express";

import { errorHandler } from "./middleware/error.middleware";
import authRouter from "./routes/auth.routes";
import healthRouter from "./routes/health.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);

app.use(errorHandler);

export default app;
