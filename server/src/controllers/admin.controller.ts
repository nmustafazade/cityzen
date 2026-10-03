import { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import {
  createCategory,
  getAdminStats,
  listAdminCategories,
  updateCategory,
} from "../services/admin.service";
import {
  createDepartment,
  listAdminDepartments,
  updateDepartment,
} from "../services/department.service";
import {
  getAdminUser,
  listAdminUsers,
  updateUserActiveStatus,
  updateUserDepartment,
  updateUserRole,
} from "../services/user.service";
import type {
  CategoryInput,
  CategoryUpdate,
  DepartmentInput,
  DepartmentUpdate,
  UserFilters,
} from "../types/admin.types";
import { AppError } from "../utils/app-error";

const roles = Object.values(UserRole);

function bodyRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object")
    throw new AppError(400, "Invalid request body");
  return body as Record<string, unknown>;
}

function positiveInteger(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0)
    throw new AppError(400, `${field} must be a positive integer`);
  return parsed;
}

function optionalPositiveInteger(
  value: unknown,
  field: string,
): number | undefined {
  return value === undefined ? undefined : positiveInteger(value, field);
}

function booleanValue(value: unknown, field: string): boolean {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new AppError(400, `${field} must be true or false`);
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  return value === undefined ? undefined : booleanValue(value, field);
}

function requiredName(value: unknown): string {
  if (typeof value !== "string" || !value.trim())
    throw new AppError(400, "name is required");
  const name = value.trim();
  if (name.length > 100)
    throw new AppError(400, "name must be 100 characters or fewer");
  return name;
}

function optionalText(
  value: unknown,
  field: string,
  maxLength = 180,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string")
    throw new AppError(400, `${field} must be a string or null`);
  const text = value.trim();
  if (text.length > maxLength)
    throw new AppError(
      400,
      `${field} must be ${maxLength} characters or fewer`,
    );
  return text || null;
}

function parseRole(value: unknown, optional = false): UserRole | undefined {
  if (optional && value === undefined) return undefined;
  if (typeof value !== "string" || !roles.includes(value as UserRole)) {
    throw new AppError(
      400,
      "role must be CITIZEN, EMPLOYEE, DEPARTMENT_HEAD, or ADMIN",
    );
  }
  return value as UserRole;
}

function currentAdminId(request: Request): number {
  if (!request.user) throw new AppError(401, "Authentication required");
  return request.user.userId;
}

function pagination(request: Request) {
  const page =
    request.query.page === undefined
      ? 1
      : positiveInteger(request.query.page, "page");
  const limit =
    request.query.limit === undefined
      ? 10
      : positiveInteger(request.query.limit, "limit");
  if (limit > 100) throw new AppError(400, "limit cannot exceed 100");
  return { page, limit };
}

export async function stats(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response.json(await getAdminStats());
  } catch (error) {
    next(error);
  }
}

export async function departments(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response.json({
      departments: await listAdminDepartments(
        optionalBoolean(request.query.isActive, "isActive"),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function createDepartmentHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = bodyRecord(request.body);
    const input: DepartmentInput = {
      name: requiredName(body.name),
      description: optionalText(body.description, "description"),
    };
    response.status(201).json({ department: await createDepartment(input) });
  } catch (error) {
    next(error);
  }
}

export async function updateDepartmentHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = bodyRecord(request.body);
    const input: DepartmentUpdate = {
      name: body.name === undefined ? undefined : requiredName(body.name),
      description: optionalText(body.description, "description"),
      isActive: optionalBoolean(body.isActive, "isActive"),
    };
    if (Object.values(input).every((value) => value === undefined))
      throw new AppError(400, "At least one field is required");
    response.json({
      department: await updateDepartment(
        positiveInteger(request.params.id, "department id"),
        input,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function users(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const search = request.query.search;
    if (search !== undefined && typeof search !== "string")
      throw new AppError(400, "search must be a string");
    if (typeof search === "string" && search.length > 100)
      throw new AppError(400, "search must be 100 characters or fewer");
    const filters: UserFilters = {
      ...pagination(request),
      role: parseRole(request.query.role, true),
      departmentId: optionalPositiveInteger(
        request.query.departmentId,
        "departmentId",
      ),
      isActive: optionalBoolean(request.query.isActive, "isActive"),
      search,
    };
    response.json(await listAdminUsers(filters));
  } catch (error) {
    next(error);
  }
}

export async function userById(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response.json({
      user: await getAdminUser(positiveInteger(request.params.id, "user id")),
    });
  } catch (error) {
    next(error);
  }
}

export async function changeUserRole(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const role = parseRole(bodyRecord(request.body).role);
    if (!role) throw new AppError(400, "role is required");
    response.json({
      user: await updateUserRole(
        positiveInteger(request.params.id, "user id"),
        currentAdminId(request),
        role,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function changeUserStatus(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = bodyRecord(request.body);
    if (body.isActive === undefined)
      throw new AppError(400, "isActive is required");
    response.json({
      user: await updateUserActiveStatus(
        positiveInteger(request.params.id, "user id"),
        currentAdminId(request),
        booleanValue(body.isActive, "isActive"),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function changeUserDepartment(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = bodyRecord(request.body);
    if (!("departmentId" in body))
      throw new AppError(400, "departmentId is required");
    const departmentId =
      body.departmentId === null
        ? null
        : positiveInteger(body.departmentId, "departmentId");
    response.json({
      user: await updateUserDepartment(
        positiveInteger(request.params.id, "user id"),
        departmentId,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function categories(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response.json({
      categories: await listAdminCategories(
        optionalBoolean(request.query.isActive, "isActive"),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function createCategoryHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = bodyRecord(request.body);
    const input: CategoryInput = {
      name: requiredName(body.name),
      description: optionalText(body.description, "description"),
      icon: optionalText(body.icon, "icon", 100),
      departmentId: positiveInteger(body.departmentId, "departmentId"),
    };
    response.status(201).json({ category: await createCategory(input) });
  } catch (error) {
    next(error);
  }
}

export async function updateCategoryHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = bodyRecord(request.body);
    const input: CategoryUpdate = {
      name: body.name === undefined ? undefined : requiredName(body.name),
      description: optionalText(body.description, "description"),
      icon: optionalText(body.icon, "icon", 100),
      isActive: optionalBoolean(body.isActive, "isActive"),
      departmentId:
        body.departmentId === undefined
          ? undefined
          : body.departmentId === null
            ? null
            : positiveInteger(body.departmentId, "departmentId"),
    };
    if (Object.values(input).every((value) => value === undefined))
      throw new AppError(400, "At least one field is required");
    response.json({
      category: await updateCategory(
        positiveInteger(request.params.id, "category id"),
        input,
      ),
    });
  } catch (error) {
    next(error);
  }
}
