import {
  Prisma,
  ReportStatus,
  UserRole,
  type ReportPriority,
} from "@prisma/client";

import database from "../config/database";
import type { AuthenticatedUser } from "../types/auth.types";
import type {
  AssignReportInput,
  ChangeReportStatusInput,
  CreateReportInput,
  ManageReportFilters,
  MyReportFilters,
} from "../types/report.types";
import { AppError } from "../utils/app-error";

const basicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
} as const;

const reportListInclude = {
  category: true,
  images: true,
  department: {
    select: { id: true, name: true },
  },
  assignedEmployee: {
    select: basicUserSelect,
  },
} as const;

const reportDetailInclude = {
  ...reportListInclude,
  citizen: {
    select: basicUserSelect,
  },
  statusHistory: {
    orderBy: { createdAt: "asc" as const },
    include: {
      changedBy: {
        select: basicUserSelect,
      },
    },
  },
} as const;

function paginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createReport(
  citizenId: number,
  input: CreateReportInput,
) {
  return database.$transaction(async (transaction) => {
    const category = await transaction.reportCategory.findFirst({
      where: { id: input.categoryId, isActive: true },
      select: { id: true },
    });

    if (!category) {
      throw new AppError(400, "Report category does not exist or is inactive");
    }

    const report = await transaction.report.create({
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        categoryId: input.categoryId,
        citizenId,
        addressText: input.addressText?.trim() || undefined,
        latitude: input.latitude,
        longitude: input.longitude,
        images: input.imageUrls?.length
          ? { create: input.imageUrls.map((imageUrl) => ({ imageUrl })) }
          : undefined,
      },
      include: reportDetailInclude,
    });

    await transaction.reportStatusHistory.create({
      data: {
        reportId: report.id,
        oldStatus: null,
        newStatus: ReportStatus.SUBMITTED,
        changedById: citizenId,
      },
    });

    return transaction.report.findUniqueOrThrow({
      where: { id: report.id },
      include: reportDetailInclude,
    });
  });
}

export async function listMyReports(
  citizenId: number,
  filters: MyReportFilters,
) {
  const where: Prisma.ReportWhereInput = {
    citizenId,
    status: filters.status,
    categoryId: filters.categoryId,
  };
  const skip = (filters.page - 1) * filters.limit;

  const [reports, total] = await database.$transaction([
    database.report.findMany({
      where,
      include: reportListInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: filters.limit,
    }),
    database.report.count({ where }),
  ]);

  return { reports, pagination: paginationMeta(total, filters.page, filters.limit) };
}

export async function getReportById(
  reportId: number,
  authenticatedUser: AuthenticatedUser,
) {
  const report = await database.report.findUnique({
    where: { id: reportId },
    include: reportDetailInclude,
  });

  if (!report) {
    throw new AppError(404, "Report not found");
  }

  if (
    authenticatedUser.role === UserRole.CITIZEN &&
    report.citizenId !== authenticatedUser.userId
  ) {
    throw new AppError(403, "You do not have permission to view this report");
  }

  return report;
}

export async function cancelReport(reportId: number, citizenId: number) {
  return database.$transaction(async (transaction) => {
    const report = await transaction.report.findUnique({
      where: { id: reportId },
      select: { id: true, citizenId: true, status: true },
    });

    if (!report) {
      throw new AppError(404, "Report not found");
    }

    if (report.citizenId !== citizenId) {
      throw new AppError(403, "You do not have permission to cancel this report");
    }

    const cancellableStatuses: ReportStatus[] = [
      ReportStatus.SUBMITTED,
      ReportStatus.UNDER_REVIEW,
    ];

    if (!cancellableStatuses.includes(report.status)) {
      throw new AppError(409, "This report can no longer be cancelled");
    }

    await transaction.report.update({
      where: { id: report.id },
      data: { status: ReportStatus.CANCELLED, resolvedAt: null },
    });

    await transaction.reportStatusHistory.create({
      data: {
        reportId: report.id,
        oldStatus: report.status,
        newStatus: ReportStatus.CANCELLED,
        changedById: citizenId,
      },
    });

    return transaction.report.findUniqueOrThrow({
      where: { id: report.id },
      include: reportDetailInclude,
    });
  });
}

export async function listReports(filters: ManageReportFilters) {
  const where: Prisma.ReportWhereInput = {
    status: filters.status,
    priority: filters.priority,
    categoryId: filters.categoryId,
    departmentId: filters.departmentId,
    assignedEmployeeId: filters.assignedEmployeeId,
    citizenId: filters.citizenId,
  };
  const skip = (filters.page - 1) * filters.limit;
  const orderBy: Prisma.ReportOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortOrder,
  };

  const [reports, total] = await database.$transaction([
    database.report.findMany({
      where,
      include: {
        ...reportListInclude,
        citizen: { select: basicUserSelect },
      },
      orderBy,
      skip,
      take: filters.limit,
    }),
    database.report.count({ where }),
  ]);

  return { reports, pagination: paginationMeta(total, filters.page, filters.limit) };
}

export async function changeReportStatus(
  reportId: number,
  changedById: number,
  input: ChangeReportStatusInput,
) {
  return database.$transaction(async (transaction) => {
    const report = await transaction.report.findUnique({
      where: { id: reportId },
      select: { id: true, status: true },
    });

    if (!report) {
      throw new AppError(404, "Report not found");
    }

    if (report.status === input.status) {
      throw new AppError(409, "Report already has this status");
    }

    await transaction.report.update({
      where: { id: report.id },
      data: {
        status: input.status,
        resolvedAt: input.status === ReportStatus.RESOLVED ? new Date() : null,
      },
    });

    await transaction.reportStatusHistory.create({
      data: {
        reportId: report.id,
        oldStatus: report.status,
        newStatus: input.status,
        changedById,
        note: input.note?.trim() || undefined,
      },
    });

    return transaction.report.findUniqueOrThrow({
      where: { id: report.id },
      include: reportDetailInclude,
    });
  });
}

export async function assignReport(
  reportId: number,
  changedById: number,
  input: AssignReportInput,
) {
  return database.$transaction(async (transaction) => {
    const report = await transaction.report.findUnique({
      where: { id: reportId },
      select: { id: true, status: true },
    });

    if (!report) {
      throw new AppError(404, "Report not found");
    }

    const department = input.departmentId
      ? await transaction.department.findFirst({
          where: { id: input.departmentId, isActive: true },
          select: { id: true },
        })
      : null;

    if (input.departmentId && !department) {
      throw new AppError(400, "Department does not exist or is inactive");
    }

    const employee = input.employeeId
      ? await transaction.user.findFirst({
          where: {
            id: input.employeeId,
            role: { in: [UserRole.EMPLOYEE, UserRole.ADMIN] },
            isActive: true,
          },
          select: { id: true, departmentId: true },
        })
      : null;

    if (input.employeeId && !employee) {
      throw new AppError(400, "Employee does not exist or cannot receive assignments");
    }

    if (
      employee?.departmentId &&
      input.departmentId &&
      employee.departmentId !== input.departmentId
    ) {
      throw new AppError(400, "Employee does not belong to the selected department");
    }

    const departmentId = input.departmentId ?? employee?.departmentId;
    const assignableStatuses: ReportStatus[] = [
      ReportStatus.SUBMITTED,
      ReportStatus.UNDER_REVIEW,
    ];
    const changesStatus = assignableStatuses.includes(report.status);

    await transaction.report.update({
      where: { id: report.id },
      data: {
        departmentId,
        assignedEmployeeId: input.employeeId,
        status: changesStatus ? ReportStatus.ASSIGNED : undefined,
      },
    });

    if (changesStatus) {
      await transaction.reportStatusHistory.create({
        data: {
          reportId: report.id,
          oldStatus: report.status,
          newStatus: ReportStatus.ASSIGNED,
          changedById,
          note: "Report assigned",
        },
      });
    }

    return transaction.report.findUniqueOrThrow({
      where: { id: report.id },
      include: reportDetailInclude,
    });
  });
}

export async function listActiveReportCategories() {
  return database.reportCategory.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}
