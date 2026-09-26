import type { UserRole } from "@prisma/client";

export interface UserFilters {
  role?: UserRole;
  departmentId?: number;
  isActive?: boolean;
  search?: string;
  page: number;
  limit: number;
}

export interface DepartmentInput {
  name: string;
  description?: string | null;
}

export interface DepartmentUpdate {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CategoryInput {
  name: string;
  description?: string | null;
  icon?: string | null;
}

export interface CategoryUpdate {
  name?: string;
  description?: string | null;
  icon?: string | null;
  isActive?: boolean;
}
