import type { Department } from "./department";
import type { ReportCategory } from "./report";
import type { UserRole } from "./user";

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone: string | null;
  profileImageUrl: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  department: Pick<Department, "id" | "name" | "isActive"> | null;
  addresses?: Array<{
    id: number;
    label: string | null;
    country: string;
    city: string;
    district: string | null;
    neighborhood: string | null;
    street: string | null;
    buildingNumber: string | null;
    postalCode: string | null;
    isPrimary: boolean;
  }>;
}

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  pagination: AdminPagination;
}

export interface AdminUserFilters {
  role?: UserRole;
  departmentId?: number;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminStats {
  users: {
    total: number;
    citizens: number;
    employees: number;
    departmentHeads: number;
    admins: number;
  };
  reports: {
    total: number;
    submitted: number;
    inProgress: number;
    resolved: number;
  };
  departments: { total: number; active: number };
  categories: { total: number; active: number };
}

export interface AdminCategory extends ReportCategory {
  createdAt: string;
  updatedAt: string;
  _count?: { reports: number };
  department: Pick<Department, "id" | "name" | "isActive"> | null;
}

export interface CategoryInput {
  name: string;
  description?: string | null;
  icon?: string | null;
  departmentId: number;
}

export interface CategoryUpdate {
  name?: string;
  description?: string | null;
  icon?: string | null;
  isActive?: boolean;
  departmentId?: number | null;
}
