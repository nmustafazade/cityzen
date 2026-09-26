export type ReportStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED";

export type ReportPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ReportCategory {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
}

export interface ReportImage {
  id: number;
  reportId: number;
  imageUrl: string;
  createdAt: string;
}

export interface ReportPerson {
  id: number;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
}

export interface ReportStatusHistory {
  id: number;
  oldStatus: ReportStatus | null;
  newStatus: ReportStatus;
  note: string | null;
  createdAt: string;
  changedBy?: ReportPerson;
}

export interface Report {
  id: number;
  title: string;
  description: string;
  status: ReportStatus;
  priority: ReportPriority;
  addressText: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  category: ReportCategory;
  images: ReportImage[];
  department?: { id: number; name: string } | null;
  assignedEmployee?: ReportPerson | null;
  citizen?: ReportPerson;
  statusHistory?: ReportStatusHistory[];
}

export interface ReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MyReportsResponse {
  reports: Report[];
  pagination: ReportPagination;
}

export interface ReportResponse {
  report: Report;
}

export interface ReportImagesResponse {
  images: ReportImage[];
}

export interface CategoriesResponse {
  categories: ReportCategory[];
}

export interface MyReportsParams {
  status?: ReportStatus;
  categoryId?: number;
  page?: number;
  limit?: number;
}

export interface CreateReportData {
  title: string;
  description: string;
  categoryId: number;
  addressText: string;
  latitude: number;
  longitude: number;
}

export interface ManageReportsParams extends MyReportsParams {
  priority?: ReportPriority;
  departmentId?: number;
  assignedEmployeeId?: number;
  citizenId?: number;
  sortBy?: "createdAt" | "updatedAt" | "priority";
  sortOrder?: "asc" | "desc";
}

export interface AssignReportData {
  departmentId: number;
  employeeId: number;
}

export interface UpdateReportStatusData {
  status: ReportStatus;
  note?: string;
}
