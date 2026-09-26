export interface Department {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    employees: number;
    reports: number;
  };
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
