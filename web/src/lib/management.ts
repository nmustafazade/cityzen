import { apiRequest } from "./api";
import type { Department } from "@/types/department";
import type { UserRole } from "@/types/user";

export interface ManagementEmployee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Extract<UserRole, "EMPLOYEE">;
  profileImageUrl: string | null;
  department: Pick<Department, "id" | "name" | "isActive"> | null;
}

export function getManagementDepartments() {
  return apiRequest<{ departments: Department[] }>("/api/management/departments");
}

export function getManagementEmployees(departmentId?: number) {
  const query = departmentId ? `?departmentId=${departmentId}` : "";
  return apiRequest<{ employees: ManagementEmployee[] }>(`/api/management/employees${query}`);
}
