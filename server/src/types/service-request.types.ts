import type { ServiceRequestStatus } from "@prisma/client";

export interface CreateServiceRequestInput {
  serviceId: number;
  description: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  preferredDate?: Date;
  contactPhone?: string;
}

export interface ServiceRequestFilters {
  status?: ServiceRequestStatus;
  serviceId?: number;
  departmentId?: number;
  assignedEmployeeId?: number;
  citizenId?: number;
  page: number;
  limit: number;
}

export interface UpdateServiceRequestStatusInput {
  status: ServiceRequestStatus;
  note?: string;
  municipalityResponse?: string;
}
