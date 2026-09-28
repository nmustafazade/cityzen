import type { ReportPriority, ReportStatus } from "@prisma/client";

export interface CreateReportInput {
  title: string;
  description: string;
  categoryId: number;
  addressText: string;
  latitude: number;
  longitude: number;
  imageUrls?: string[];
  isPublic?: boolean;
}

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface MyReportFilters extends PaginationInput {
  status?: ReportStatus;
  categoryId?: number;
}

export interface ManageReportFilters extends PaginationInput {
  status?: ReportStatus;
  priority?: ReportPriority;
  categoryId?: number;
  departmentId?: number;
  assignedEmployeeId?: number;
  citizenId?: number;
  sortBy: "createdAt" | "updatedAt" | "priority";
  sortOrder: "asc" | "desc";
}

export interface ChangeReportStatusInput {
  status: ReportStatus;
  note?: string;
}

export interface AssignReportInput {
  departmentId?: number;
  employeeId?: number;
}
