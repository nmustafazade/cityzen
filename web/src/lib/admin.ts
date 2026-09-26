import { apiRequest } from "./api";
import type {
  AdminCategory,
  AdminStats,
  AdminUser,
  AdminUserFilters,
  AdminUsersResponse,
  CategoryInput,
  CategoryUpdate,
} from "@/types/admin";
import type { Department, DepartmentInput, DepartmentUpdate } from "@/types/department";
import type { UserRole } from "@/types/user";

function usersQuery(params: AdminUserFilters) {
  const query = new URLSearchParams();
  if (params.role) query.set("role", params.role);
  if (params.departmentId) query.set("departmentId", String(params.departmentId));
  if (params.isActive !== undefined) query.set("isActive", String(params.isActive));
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  return query.toString();
}

export function getAdminStats() {
  return apiRequest<AdminStats>("/api/admin/stats");
}

export function getAdminUsers(params: AdminUserFilters = {}) {
  const query = usersQuery(params);
  return apiRequest<AdminUsersResponse>(`/api/admin/users${query ? `?${query}` : ""}`);
}

export function getAdminUser(id: number) {
  return apiRequest<{ user: AdminUser }>(`/api/admin/users/${id}`);
}

export function updateUserRole(id: number, role: UserRole) {
  return apiRequest<{ user: AdminUser }>(`/api/admin/users/${id}/role`, { method: "PATCH", body: { role } });
}

export function updateUserStatus(id: number, isActive: boolean) {
  return apiRequest<{ user: AdminUser }>(`/api/admin/users/${id}/status`, { method: "PATCH", body: { isActive } });
}

export function updateUserDepartment(id: number, departmentId: number | null) {
  return apiRequest<{ user: AdminUser }>(`/api/admin/users/${id}/department`, { method: "PATCH", body: { departmentId } });
}

export function getAdminDepartments(isActive?: boolean) {
  const query = isActive === undefined ? "" : `?isActive=${isActive}`;
  return apiRequest<{ departments: Department[] }>(`/api/admin/departments${query}`);
}

export function createDepartment(data: DepartmentInput) {
  return apiRequest<{ department: Department }>("/api/admin/departments", { method: "POST", body: data });
}

export function updateDepartment(id: number, data: DepartmentUpdate) {
  return apiRequest<{ department: Department }>(`/api/admin/departments/${id}`, { method: "PATCH", body: data });
}

export function getAdminCategories(isActive?: boolean) {
  const query = isActive === undefined ? "" : `?isActive=${isActive}`;
  return apiRequest<{ categories: AdminCategory[] }>(`/api/admin/report-categories${query}`);
}

export function createCategory(data: CategoryInput) {
  return apiRequest<{ category: AdminCategory }>("/api/admin/report-categories", { method: "POST", body: data });
}

export function updateCategory(id: number, data: CategoryUpdate) {
  return apiRequest<{ category: AdminCategory }>(`/api/admin/report-categories/${id}`, { method: "PATCH", body: data });
}
