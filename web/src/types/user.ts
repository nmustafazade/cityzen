export type UserRole = "CITIZEN" | "EMPLOYEE" | "DEPARTMENT_HEAD" | "ADMIN";

export interface DepartmentSummary {
  id: number;
  name: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone: string | null;
  profileImageUrl: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  department: DepartmentSummary | null;
}
