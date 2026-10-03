import { UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

import database from "../config/database";
import type { LoginInput, RegisterInput } from "../types/auth.types";
import { AppError } from "../utils/app-error";
import { signAuthToken } from "../utils/jwt";

const SALT_ROUNDS = 12;

const safeUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  phone: true,
  profileImageUrl: true,
  isEmailVerified: true,
  createdAt: true,
  department: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

export async function registerCitizen(input: RegisterInput) {
  const email = input.email.trim().toLowerCase();
  const existingUser = await database.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await database.user.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      passwordHash,
      role: UserRole.CITIZEN,
    },
    select: safeUserSelect,
  });

  return {
    user,
    token: signAuthToken({ userId: user.id, role: user.role }),
  };
}

export async function loginUser(input: LoginInput) {
  const email = input.email.trim().toLowerCase();
  const user = await database.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new AppError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new AppError(401, "Invalid email or password");
  }

  const safeUser = await database.user.findUniqueOrThrow({
    where: { id: user.id },
    select: safeUserSelect,
  });

  return {
    user: safeUser,
    token: signAuthToken({ userId: user.id, role: user.role }),
  };
}

export async function getCurrentUser(userId: number) {
  const user = await database.user.findUnique({
    where: { id: userId },
    select: {
      ...safeUserSelect,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError(401, "Authentication required");
  }

  const { isActive: _isActive, ...safeUser } = user;
  return safeUser;
}
