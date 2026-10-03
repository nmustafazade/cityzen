import type { NextFunction, Request, Response } from "express";

import database from "../config/database";
import { listManagementDepartments } from "../services/department.service";
import { listManagementEmployees } from "../services/user.service";
import { AppError } from "../utils/app-error";

function optionalPositiveInteger(
  value: unknown,
  field: string,
): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(400, `${field} must be a positive integer`);
  }
  return parsed;
}

export async function departments(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!request.user) throw new AppError(401, "Authentication required");
    response.json({
      departments: await listManagementDepartments(
        request.user.role === "DEPARTMENT_HEAD"
          ? request.user.userId
          : undefined,
      ),
    });
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
    const departmentId = optionalPositiveInteger(
      request.query.departmentId,
      "departmentId",
    );
    if (!request.user) throw new AppError(401, "Authentication required");
    const effectiveDepartmentId =
      request.user.role === "DEPARTMENT_HEAD"
        ? await departmentIdForHead(request.user.userId, departmentId)
        : departmentId;
    response.json({
      employees: await listManagementEmployees(effectiveDepartmentId),
    });
  } catch (error) {
    next(error);
  }
}

async function departmentIdForHead(
  userId: number,
  requestedDepartmentId?: number,
) {
  const department = await database.user.findUnique({
    where: { id: userId },
    select: { departmentId: true },
  });
  if (!department?.departmentId)
    throw new AppError(403, "Department head is not assigned to a department");
  if (
    requestedDepartmentId &&
    requestedDepartmentId !== department.departmentId
  ) {
    throw new AppError(
      403,
      "Department heads may access only their own employees",
    );
  }
  return department.departmentId;
}
