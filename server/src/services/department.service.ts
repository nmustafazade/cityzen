import database from "../config/database";
import type { DepartmentInput, DepartmentUpdate } from "../types/admin.types";
import { AppError } from "../utils/app-error";

const departmentSelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { employees: true, reports: true } },
} as const;

export async function listManagementDepartments() {
  return database.department.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function listAdminDepartments(isActive?: boolean) {
  return database.department.findMany({
    where: { isActive },
    select: departmentSelect,
    orderBy: { name: "asc" },
  });
}

async function ensureUniqueDepartmentName(name: string, excludeId?: number) {
  const existing = await database.department.findFirst({
    where: { name, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (existing) throw new AppError(409, "A department with this name already exists");
}

export async function createDepartment(input: DepartmentInput) {
  const name = input.name.trim();
  await ensureUniqueDepartmentName(name);
  return database.department.create({
    data: { name, description: input.description?.trim() || null },
    select: departmentSelect,
  });
}

export async function updateDepartment(id: number, input: DepartmentUpdate) {
  const current = await database.department.findUnique({ where: { id }, select: { id: true } });
  if (!current) throw new AppError(404, "Department not found");
  const name = input.name?.trim();
  if (name) await ensureUniqueDepartmentName(name, id);
  return database.department.update({
    where: { id },
    data: {
      name,
      description: input.description === undefined ? undefined : input.description?.trim() || null,
      isActive: input.isActive,
    },
    select: departmentSelect,
  });
}
