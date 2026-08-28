import type { NextFunction, Request, Response } from "express";

import { verifyAuthToken } from "../utils/jwt";

export function authenticate(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const authorization = request.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    response.status(401).json({
      status: "error",
      message: "Authentication required",
    });
    return;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    response.status(401).json({
      status: "error",
      message: "Authentication required",
    });
    return;
  }

  try {
    request.user = verifyAuthToken(token);
    next();
  } catch {
    response.status(401).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }
}
