import { apiRequest } from "./api";
import type {
  CategoriesResponse,
  AssignReportData,
  CreateReportData,
  ManageReportsParams,
  MyReportsParams,
  MyReportsResponse,
  ReportResponse,
  UpdateReportStatusData,
} from "@/types/report";

export async function getReportCategories() {
  return apiRequest<CategoriesResponse>("/api/report-categories");
}

export async function getMyReports(params: MyReportsParams = {}) {
  const query = new URLSearchParams();

  if (params.status) query.set("status", params.status);
  if (params.categoryId) query.set("categoryId", String(params.categoryId));
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const search = query.toString();
  return apiRequest<MyReportsResponse>(`/api/reports/my${search ? `?${search}` : ""}`);
}

export async function getReport(id: number) {
  return apiRequest<ReportResponse>(`/api/reports/${id}`);
}

export async function createReport(data: CreateReportData) {
  return apiRequest<ReportResponse>("/api/reports", {
    method: "POST",
    body: data,
  });
}

export async function cancelReport(id: number) {
  return apiRequest<ReportResponse>(`/api/reports/${id}/cancel`, {
    method: "PATCH",
  });
}

export async function getReports(params: ManageReportsParams = {}) {
  const query = new URLSearchParams();
  const numericFilters = [
    ["categoryId", params.categoryId],
    ["departmentId", params.departmentId],
    ["assignedEmployeeId", params.assignedEmployeeId],
    ["citizenId", params.citizenId],
    ["page", params.page],
    ["limit", params.limit],
  ] as const;

  if (params.status) query.set("status", params.status);
  if (params.priority) query.set("priority", params.priority);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  numericFilters.forEach(([key, value]) => {
    if (value) query.set(key, String(value));
  });

  const search = query.toString();
  return apiRequest<MyReportsResponse>(`/api/reports${search ? `?${search}` : ""}`);
}

export async function assignReport(id: number, data: AssignReportData) {
  return apiRequest<ReportResponse>(`/api/reports/${id}/assign`, {
    method: "PATCH",
    body: data,
  });
}

export async function updateReportStatus(
  id: number,
  data: UpdateReportStatusData,
) {
  return apiRequest<ReportResponse>(`/api/reports/${id}/status`, {
    method: "PATCH",
    body: data,
  });
}
