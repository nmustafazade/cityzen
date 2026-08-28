import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";

import { AppError } from "../utils/app-error";

export const errorHandler: ErrorRequestHandler = (
  error,
  request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    response.status(409).json({
      status: "error",
      message: "An account with this email already exists",
    });
    return;
  }

  if (request.path === "/api/health/database") {
    response.status(503).json({
      status: "error",
      database: "disconnected",
    });
    return;
  }

  response.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
