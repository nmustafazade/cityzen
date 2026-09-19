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
  addressText?: string;
  latitude?: number;
  longitude?: number;
}
