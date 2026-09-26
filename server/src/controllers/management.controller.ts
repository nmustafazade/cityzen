import type { NextFunction, Request, Response } from "express";

import { listManagementDepartments } from "../services/department.service";
import { listManagementEmployees } from "../services/user.service";
import { AppError } from "../utils/app-error";

function optionalPositiveInteger(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(400, `${field} must be a positive integer`);
  }
  return parsed;
}

export async function departments(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response.json({ departments: await listManagementDepartments() });
  } catch (error) {
    next(error);
  }
}

export async function employees(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const departmentId = optionalPositiveInteger(request.query.departmentId, "departmentId");
    response.json({ employees: await listManagementEmployees(departmentId) });
  } catch (error) {
    next(error);
  }
}
