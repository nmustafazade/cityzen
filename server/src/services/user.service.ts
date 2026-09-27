import { Prisma, UserRole } from "@prisma/client";

import database from "../config/database";
import type { UserFilters } from "../types/admin.types";
import { AppError } from "../utils/app-error";

export const safeUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  phone: true,
  profileImageUrl: true,
  isActive: true,
  isEmailVerified: true,
  createdAt: true,
  updatedAt: true,
  department: { select: { id: true, name: true, isActive: true } },
} as const;

export async function listManagementEmployees(departmentId?: number) {
  return database.user.findMany({
    where: {
      isActive: true,
      role: UserRole.EMPLOYEE,
      departmentId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      profileImageUrl: true,
      department: { select: { id: true, name: true, isActive: true } },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
}

export async function listAdminUsers(filters: UserFilters) {
  const search = filters.search?.trim();
  const where: Prisma.UserWhereInput = {
    role: filters.role,
    departmentId: filters.departmentId,
    isActive: filters.isActive,
    OR: search
      ? [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
        ]
      : undefined,
  };
  const [users, total] = await database.$transaction([
    database.user.findMany({
      where,
      select: safeUserSelect,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    database.user.count({ where }),
  ]);
  return {
    users,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getAdminUser(id: number) {
  const user = await database.user.findUnique({
    where: { id },
    select: {
      ...safeUserSelect,
      addresses: {
        select: {
          id: true,
          label: true,
          country: true,
          city: true,
          district: true,
          neighborhood: true,
          street: true,
          buildingNumber: true,
          postalCode: true,
          isPrimary: true,
        },
      },
    },
  });
  if (!user) throw new AppError(404, "User not found");
  return user;
}

export async function updateUserRole(id: number, currentAdminId: number, role: UserRole) {
  const user = await database.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!user) throw new AppError(404, "User not found");
  if (id === currentAdminId && role !== UserRole.ADMIN) {
    throw new AppError(400, "You cannot remove your own administrator role");
  }
  return database.$transaction(async (transaction) => {
    if (role !== UserRole.EMPLOYEE) {
      await transaction.report.updateMany({
        where: { assignedEmployeeId: id },
        data: { assignedEmployeeId: null },
      });
    }
    return transaction.user.update({
      where: { id },
      data: { role, departmentId: role === UserRole.CITIZEN ? null : undefined },
      select: safeUserSelect,
    });
  });
}

export async function updateUserActiveStatus(id: number, currentAdminId: number, isActive: boolean) {
  const user = await database.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) throw new AppError(404, "User not found");
  if (id === currentAdminId && !isActive) {
    throw new AppError(400, "You cannot deactivate your own account");
  }
  return database.user.update({ where: { id }, data: { isActive }, select: safeUserSelect });
}

export async function updateUserDepartment(id: number, departmentId: number | null) {
  const user = await database.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!user) throw new AppError(404, "User not found");
  if (user.role === UserRole.CITIZEN) {
    throw new AppError(400, "Citizens cannot belong to a municipality department");
  }
  if (departmentId !== null) {
    const department = await database.department.findFirst({
      where: { id: departmentId, isActive: true },
      select: { id: true },
    });
    if (!department) throw new AppError(400, "Department does not exist or is inactive");
  }
  return database.$transaction(async (transaction) => {
    if (user.role === UserRole.EMPLOYEE) {
      await transaction.report.updateMany({
        where: {
          assignedEmployeeId: id,
          departmentId: departmentId === null ? undefined : { not: departmentId },
        },
        data: { assignedEmployeeId: null },
      });
    }
    return transaction.user.update({
      where: { id },
      data: { departmentId },
      select: safeUserSelect,
    });
  });
}
