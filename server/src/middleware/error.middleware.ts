import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import multer from "multer";

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

  if (error instanceof multer.MulterError) {
    const messages: Partial<Record<multer.ErrorCode, string>> = {
      LIMIT_FILE_SIZE: "Each image must be 5 MB or smaller",
      LIMIT_FILE_COUNT: "A maximum of 5 images may be uploaded at once",
      LIMIT_UNEXPECTED_FILE:
        "Use the images field and upload no more than 5 files",
    };
    response.status(400).json({
      status: "error",
      message: messages[error.code] ?? "Invalid image upload",
    });
    return;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    response.status(409).json({
      status: "error",
      message: "A record with this value already exists",
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
