import {
  Prisma,
  NotificationType,
  ReportStatus,
  UserRole,
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
import { createNotification } from "./notification.service";

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

function statusLabel(status: ReportStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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
      select: {
        id: true,
        allowsPublicSharing: true,
        department: {
          select: {
            id: true,
            name: true,
            isActive: true,
            employees: {
              where: { role: UserRole.DEPARTMENT_HEAD, isActive: true },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!category) {
      throw new AppError(400, "Report category does not exist or is inactive");
    }
    if (!category.department?.isActive) {
      throw new AppError(
        409,
        "This report category is not assigned to an active department",
      );
    }
    if (input.isPublic && !category.allowsPublicSharing)
      throw new AppError(409, "This category does not allow public sharing");

    const report = await transaction.report.create({
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        categoryId: input.categoryId,
        departmentId: category.department.id,
        citizenId,
        addressText: input.addressText?.trim() || undefined,
        latitude: input.latitude,
        longitude: input.longitude,
        isPublic: input.isPublic ?? false,
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

    for (const head of category.department.employees) {
      await createNotification(
        {
          userId: head.id,
          actorId: citizenId,
          reportId: report.id,
          type: NotificationType.REPORT_CREATED,
          title: "New department report",
          message: `A new report #${report.id}, "${report.title}", was submitted to ${category.department.name}.`,
        },
        transaction,
      );
    }

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

  return {
    reports,
    pagination: paginationMeta(total, filters.page, filters.limit),
  };
}

function staffReportScope(
  authenticatedUser: AuthenticatedUser,
): Prisma.ReportWhereInput {
  if (authenticatedUser.role === UserRole.ADMIN) return {};
  if (authenticatedUser.role === UserRole.DEPARTMENT_HEAD) {
    return {
      department: {
        employees: {
          some: {
            id: authenticatedUser.userId,
            role: UserRole.DEPARTMENT_HEAD,
          },
        },
      },
    };
  }
  if (authenticatedUser.role === UserRole.EMPLOYEE) {
    return { assignedEmployeeId: authenticatedUser.userId };
  }
  return { citizenId: authenticatedUser.userId };
}

export async function getReportById(
  reportId: number,
  authenticatedUser: AuthenticatedUser,
) {
  const report = await database.report.findFirst({
    where: { id: reportId, ...staffReportScope(authenticatedUser) },
    include: {
      ...reportDetailInclude,
      _count: { select: { upvotes: true } },
      upvotes: {
        where: { userId: authenticatedUser.userId },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!report) {
    throw new AppError(404, "Report not found");
  }

  const { _count, upvotes, ...reportData } = report;
  return {
    ...reportData,
    upvoteCount: _count.upvotes,
    hasUpvoted: upvotes.length > 0,
  };
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
      throw new AppError(
        403,
        "You do not have permission to cancel this report",
      );
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

export async function listReports(
  authenticatedUser: AuthenticatedUser,
  filters: ManageReportFilters,
) {
  const where: Prisma.ReportWhereInput = {
    AND: [
      staffReportScope(authenticatedUser),
      {
        status: filters.status,
        priority: filters.priority,
        categoryId: filters.categoryId,
        departmentId: filters.departmentId,
        assignedEmployeeId: filters.assignedEmployeeId,
        citizenId: filters.citizenId,
      },
    ],
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

  return {
    reports,
    pagination: paginationMeta(total, filters.page, filters.limit),
  };
}

export async function changeReportStatus(
  reportId: number,
  authenticatedUser: AuthenticatedUser,
  input: ChangeReportStatusInput,
) {
  return database.$transaction(async (transaction) => {
    const report = await transaction.report.findFirst({
      where: { id: reportId, ...staffReportScope(authenticatedUser) },
      select: { id: true, status: true, title: true, citizenId: true },
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
        changedById: authenticatedUser.userId,
        note: input.note?.trim() || undefined,
      },
    });

    const resolved = input.status === ReportStatus.RESOLVED;
    await createNotification(
      {
        userId: report.citizenId,
        actorId: authenticatedUser.userId,
        reportId: report.id,
        type: resolved
          ? NotificationType.REPORT_RESOLVED
          : NotificationType.REPORT_STATUS_CHANGED,
        title: resolved ? "Report resolved" : "Report status updated",
        message: resolved
          ? `Your report "${report.title}" has been resolved.`
          : `Your report "${report.title}" is now ${statusLabel(input.status)}.`,
      },
      transaction,
    );

    return transaction.report.findUniqueOrThrow({
      where: { id: report.id },
      include: reportDetailInclude,
    });
  });
}

export async function assignReport(
  reportId: number,
  authenticatedUser: AuthenticatedUser,
  input: AssignReportInput,
) {
  return database.$transaction(async (transaction) => {
    const actor = await transaction.user.findUnique({
      where: { id: authenticatedUser.userId },
      select: { id: true, role: true, departmentId: true },
    });
    if (!actor) throw new AppError(401, "Authentication required");
    const report = await transaction.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        status: true,
        title: true,
        citizenId: true,
        departmentId: true,
      },
    });

    if (!report) {
      throw new AppError(404, "Report not found");
    }
    if (
      actor.role === UserRole.DEPARTMENT_HEAD &&
      (!actor.departmentId || report.departmentId !== actor.departmentId)
    ) {
      throw new AppError(
        403,
        "Department heads may assign only reports in their department",
      );
    }
    if (
      actor.role === UserRole.DEPARTMENT_HEAD &&
      input.departmentId &&
      input.departmentId !== actor.departmentId
    ) {
      throw new AppError(
        403,
        "Department heads cannot move reports to another department",
      );
    }

    const department = input.departmentId
      ? await transaction.department.findFirst({
          where: { id: input.departmentId, isActive: true },
          select: { id: true, name: true },
        })
      : null;

    if (input.departmentId && !department) {
      throw new AppError(400, "Department does not exist or is inactive");
    }

    const employee = input.employeeId
      ? await transaction.user.findFirst({
          where: {
            id: input.employeeId,
            role: UserRole.EMPLOYEE,
            isActive: true,
          },
          select: { id: true, departmentId: true },
        })
      : null;

    if (input.employeeId && !employee) {
      throw new AppError(
        400,
        "Employee does not exist or cannot receive assignments",
      );
    }

    if (
      actor.role === UserRole.DEPARTMENT_HEAD &&
      employee?.departmentId !== actor.departmentId
    ) {
      throw new AppError(
        403,
        "Department heads may assign only employees in their department",
      );
    }

    if (
      employee &&
      input.departmentId &&
      employee.departmentId !== input.departmentId
    ) {
      throw new AppError(
        400,
        "Employee does not belong to the selected department",
      );
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
          changedById: authenticatedUser.userId,
          note: "Report assigned",
        },
      });
    }

    await createNotification(
      {
        userId: report.citizenId,
        actorId: authenticatedUser.userId,
        reportId: report.id,
        type: NotificationType.REPORT_ASSIGNED,
        title: "Report assigned",
        message: `Your report "${report.title}" has been assigned${department?.name ? ` to ${department.name}` : ""}.`,
      },
      transaction,
    );

    if (employee) {
      await createNotification(
        {
          userId: employee.id,
          actorId: authenticatedUser.userId,
          reportId: report.id,
          type: NotificationType.REPORT_ASSIGNED,
          title: "Report assigned to you",
          message: `You have been assigned report #${report.id}: "${report.title}".`,
        },
        transaction,
      );
    }

    return transaction.report.findUniqueOrThrow({
      where: { id: report.id },
      include: reportDetailInclude,
    });
  });
}

export async function listActiveReportCategories() {
  return database.reportCategory.findMany({
    where: { isActive: true, department: { isActive: true } },
    include: { department: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });
}
