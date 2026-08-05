import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
  _error,
  request,
  response,
  _next,
) => {
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
