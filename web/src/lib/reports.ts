import { apiRequest } from "./api";
import type {
  CategoriesResponse,
  CreateReportData,
  MyReportsParams,
  MyReportsResponse,
  ReportResponse,
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
