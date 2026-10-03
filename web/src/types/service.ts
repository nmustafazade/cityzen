import type { Department } from "./department";
export type ServiceFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "DATE"
  | "DATETIME"
  | "SELECT"
  | "CHECKBOX"
  | "PHONE"
  | "EMAIL";
export interface MunicipalServiceField {
  id: number;
  label: string;
  fieldKey: string;
  type: ServiceFieldType;
  description: string | null;
  placeholder: string | null;
  isRequired: boolean;
  options: Array<{ value: string; label: string }> | null;
  minLength: number | null;
  maxLength: number | null;
  minValue: string | number | null;
  maxValue: string | number | null;
  sortOrder: number;
  isActive: boolean;
}
export interface MunicipalService {
  id: number;
  title: string;
  description: string;
  instructions: string | null;
  requirements: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  externalUrl: string | null;
  address: string | null;
  imageUrl: string | null;
  isActive: boolean;
  allowsDocuments: boolean;
  documentsRequired: boolean;
  maxDocuments: number;
  supportsAppointments: boolean;
  appointmentRequired: boolean;
  fields?: MunicipalServiceField[];
  createdAt: string;
  updatedAt: string;
  department: Pick<Department, "id" | "name">;
}
export interface ServiceInput {
  departmentId?: number;
  title: string;
  description: string;
  instructions?: string | null;
  requirements?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  externalUrl?: string | null;
  address?: string | null;
  isActive?: boolean;
}
