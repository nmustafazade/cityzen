import type { MunicipalService } from "./service";

export type ServiceRequestStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";
export interface ServiceRequestUser {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string | null;
  profileImageUrl?: string | null;
}
export interface ServiceRequestHistory {
  id: number;
  oldStatus: ServiceRequestStatus | null;
  newStatus: ServiceRequestStatus;
  note: string | null;
  createdAt: string;
  changedBy: ServiceRequestUser;
}
export interface ServiceRequest {
  id: number;
  serviceId: number;
  citizenId: number;
  departmentId: number;
  assignedEmployeeId: number | null;
  status: ServiceRequestStatus;
  description: string;
  address: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  preferredDate: string | null;
  contactPhone: string | null;
  municipalityResponse: string | null;
  submittedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  service: Pick<
    MunicipalService,
    | "id"
    | "title"
    | "isActive"
    | "allowsDocuments"
    | "documentsRequired"
    | "maxDocuments"
  >;
  department: { id: number; name: string };
  citizen?: ServiceRequestUser;
  assignedEmployee: ServiceRequestUser | null;
  history?: ServiceRequestHistory[];
  fieldValues?: Array<{
    id: number;
    value: unknown;
    fieldLabelSnapshot: string;
    fieldTypeSnapshot: import("./service").ServiceFieldType;
  }>;
  documents?: Array<{
    id: number;
    originalFileName: string;
    mimeType: string;
    fileSize: number;
    createdAt: string;
  }>;
  appointmentSlot?: {
    id: number;
    startsAt: string;
    endsAt: string;
    capacity: number;
  } | null;
}
export interface ServiceRequestListResponse {
  requests: ServiceRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
