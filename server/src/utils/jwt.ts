import type { UserRole } from "@prisma/client";
import jwt, { type SignOptions } from "jsonwebtoken";

import type { AuthenticatedUser } from "../types/auth.types";

interface JwtPayload {
  userId: number;
  role: UserRole;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export function validateJwtConfiguration(): void {
  getJwtSecret();

  if (!process.env.JWT_EXPIRES_IN) {
    throw new Error("JWT_EXPIRES_IN is not configured");
  }
}

export function signAuthToken(payload: JwtPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ??
    "1d") as SignOptions["expiresIn"];

  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function verifyAuthToken(token: string): AuthenticatedUser {
  const payload = jwt.verify(token, getJwtSecret());

  if (
    typeof payload === "string" ||
    typeof payload.userId !== "number" ||
    typeof payload.role !== "string" ||
    !["CITIZEN", "EMPLOYEE", "ADMIN"].includes(payload.role)
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    userId: payload.userId,
    role: payload.role as UserRole,
  };
}
