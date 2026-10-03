import { apiRequest } from "./api";
import type {
  CategoriesResponse,
  AssignReportData,
  CreateReportData,
  ManageReportsParams,
  MyReportsParams,
  MyReportsResponse,
  ReportResponse,
  ReportImagesResponse,
  ReportCommentsResponse,
  ReportComment,
  ReportFeedbackResponse,
  ReportFeedback,
  FeedbackInput,
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
  return apiRequest<MyReportsResponse>(
    `/api/reports/my${search ? `?${search}` : ""}`,
  );
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

export async function uploadReportImages(reportId: number, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  return apiRequest<ReportImagesResponse>(`/api/reports/${reportId}/images`, {
    method: "POST",
    body: formData,
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
  return apiRequest<MyReportsResponse>(
    `/api/reports${search ? `?${search}` : ""}`,
  );
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

export function getReportComments(reportId: number) {
  return apiRequest<ReportCommentsResponse>(
    `/api/reports/${reportId}/comments`,
  );
}

export function createReportComment(
  reportId: number,
  content: string,
  parentCommentId?: number,
) {
  return apiRequest<{ comment: ReportComment }>(
    `/api/reports/${reportId}/comments`,
    {
      method: "POST",
      body: { content, parentCommentId },
    },
  );
}

export function deleteReportComment(reportId: number, commentId: number) {
  return apiRequest<{ status: "ok"; message: string }>(
    `/api/reports/${reportId}/comments/${commentId}`,
    {
      method: "DELETE",
    },
  );
}

export function toggleReportUpvote(reportId: number) {
  return apiRequest<{ upvoted: boolean; upvoteCount: number }>(
    `/api/reports/${reportId}/upvote`,
    {
      method: "POST",
    },
  );
}
export function setReportVisibility(reportId: number, isPublic: boolean) {
  return apiRequest<ReportResponse>(`/api/reports/${reportId}/visibility`, {
    method: "PATCH",
    body: { isPublic },
  });
}

export function getReportFeedback(reportId: number) {
  return apiRequest<ReportFeedbackResponse>(
    `/api/reports/${reportId}/feedback`,
  );
}

export function saveReportFeedback(reportId: number, data: FeedbackInput) {
  return apiRequest<{ feedback: ReportFeedback }>(
    `/api/reports/${reportId}/feedback`,
    {
      method: "PUT",
      body: data,
    },
  );
}
