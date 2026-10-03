import type { NextFunction, Request, Response } from "express";

import {
  getCurrentUser,
  loginUser,
  registerCitizen,
} from "../services/auth.service";
import type { LoginInput, RegisterInput } from "../types/auth.types";
import { AppError } from "../utils/app-error";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function validateRegisterBody(body: unknown): RegisterInput {
  if (!body || typeof body !== "object") {
    throw new AppError(400, "Invalid request body");
  }

  const { firstName, lastName, email, password } = body as Record<
    string,
    unknown
  >;

  if (
    typeof firstName !== "string" ||
    !firstName.trim() ||
    typeof lastName !== "string" ||
    !lastName.trim() ||
    typeof email !== "string" ||
    !emailPattern.test(email.trim()) ||
    typeof password !== "string"
  ) {
    throw new AppError(
      400,
      "Valid firstName, lastName, email, and password are required",
    );
  }

  if (!passwordPattern.test(password)) {
    throw new AppError(
      400,
      "Password must be at least 8 characters and include uppercase, lowercase, and a number",
    );
  }

  return { firstName, lastName, email, password };
}

function validateLoginBody(body: unknown): LoginInput {
  if (!body || typeof body !== "object") {
    throw new AppError(400, "Email and password are required");
  }

  const { email, password } = body as Record<string, unknown>;

  if (
    typeof email !== "string" ||
    !emailPattern.test(email.trim()) ||
    typeof password !== "string" ||
    !password
  ) {
    throw new AppError(400, "Email and password are required");
  }

  return { email, password };
}

export async function register(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await registerCitizen(validateRegisterBody(request.body));
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await loginUser(validateLoginBody(request.body));
    response.json(result);
  } catch (error) {
    next(error);
  }
}

export async function me(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    response.json({ user: await getCurrentUser(request.user.userId) });
  } catch (error) {
    next(error);
  }
}
