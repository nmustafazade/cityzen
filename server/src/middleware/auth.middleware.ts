import type { NextFunction, Request, Response } from "express";

import database from "../config/database";
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

  let tokenUser;
  try {
    tokenUser = verifyAuthToken(token);
  } catch {
    response.status(401).json({
      status: "error",
      message: "Invalid or expired token",
    });
    return;
  }

  void database.user.findUnique({
    where: { id: tokenUser.userId },
    select: { id: true, role: true, isActive: true },
  }).then((user) => {
    if (!user?.isActive) {
      response.status(401).json({ status: "error", message: "Authentication required" });
      return;
    }
    request.user = { userId: user.id, role: user.role };
    next();
  }).catch(next);
}
