import { ReportStatus, UserRole } from "@prisma/client";

import database from "../config/database";
import type { CategoryInput, CategoryUpdate } from "../types/admin.types";
import { AppError } from "../utils/app-error";

const categorySelect = {
  id: true,
  name: true,
  description: true,
  icon: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { reports: true } },
} as const;

export async function listAdminCategories(isActive?: boolean) {
  return database.reportCategory.findMany({
    where: { isActive },
    select: categorySelect,
    orderBy: { name: "asc" },
  });
}

async function ensureUniqueCategoryName(name: string, excludeId?: number) {
  const existing = await database.reportCategory.findFirst({
    where: { name, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (existing) throw new AppError(409, "A report category with this name already exists");
}

export async function createCategory(input: CategoryInput) {
  const name = input.name.trim();
  await ensureUniqueCategoryName(name);
  return database.reportCategory.create({
    data: {
      name,
      description: input.description?.trim() || null,
      icon: input.icon?.trim() || null,
    },
    select: categorySelect,
  });
}

export async function updateCategory(id: number, input: CategoryUpdate) {
  const current = await database.reportCategory.findUnique({ where: { id }, select: { id: true } });
  if (!current) throw new AppError(404, "Report category not found");
  const name = input.name?.trim();
  if (name) await ensureUniqueCategoryName(name, id);
  return database.reportCategory.update({
    where: { id },
    data: {
      name,
      description: input.description === undefined ? undefined : input.description?.trim() || null,
      icon: input.icon === undefined ? undefined : input.icon?.trim() || null,
      isActive: input.isActive,
    },
    select: categorySelect,
  });
}

export async function getAdminStats() {
  const [
    totalUsers,
    citizens,
    employees,
    admins,
    totalReports,
    submitted,
    inProgress,
    resolved,
    totalDepartments,
    activeDepartments,
    totalCategories,
    activeCategories,
  ] = await database.$transaction([
    database.user.count(),
    database.user.count({ where: { role: UserRole.CITIZEN } }),
    database.user.count({ where: { role: UserRole.EMPLOYEE } }),
    database.user.count({ where: { role: UserRole.ADMIN } }),
    database.report.count(),
    database.report.count({ where: { status: ReportStatus.SUBMITTED } }),
    database.report.count({ where: { status: ReportStatus.IN_PROGRESS } }),
    database.report.count({ where: { status: ReportStatus.RESOLVED } }),
    database.department.count(),
    database.department.count({ where: { isActive: true } }),
    database.reportCategory.count(),
    database.reportCategory.count({ where: { isActive: true } }),
  ]);
  return {
    users: { total: totalUsers, citizens, employees, admins },
    reports: { total: totalReports, submitted, inProgress, resolved },
    departments: { total: totalDepartments, active: activeDepartments },
    categories: { total: totalCategories, active: activeCategories },
  };
}
