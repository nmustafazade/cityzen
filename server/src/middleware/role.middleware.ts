import type { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction): void => {
    if (!request.user) {
      response.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      response.status(403).json({
        status: "error",
        message: "You do not have permission to access this resource",
      });
      return;
    }

    next();
  };
}
