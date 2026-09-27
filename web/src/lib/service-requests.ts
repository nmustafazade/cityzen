import { apiRequest } from "./api";
import type { ServiceRequest, ServiceRequestListResponse, ServiceRequestStatus } from "@/types/service-request";

type Params = { status?: ServiceRequestStatus | ""; serviceId?: number; departmentId?: number; assignedEmployeeId?: number; page?: number; limit?: number };
function query(params: Params = {}) { const search = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") search.set(key, String(value)); }); const value = search.toString(); return value ? `?${value}` : ""; }
export function serviceRequestReference(id: number) { return `SR-${String(id).padStart(6, "0")}`; }
export function createServiceRequest(data: { serviceId: number; description: string; address?: string; latitude?: number; longitude?: number; preferredDate?: string; contactPhone?: string }) { return apiRequest<{ request: ServiceRequest }>("/api/service-requests", { method: "POST", body: data }); }
export function getMyServiceRequests(params?: Params) { return apiRequest<ServiceRequestListResponse>(`/api/service-requests/my${query(params)}`); }
export function getManagedServiceRequests(params?: Params) { return apiRequest<ServiceRequestListResponse>(`/api/municipality/service-requests${query(params)}`); }
export function getServiceRequest(id: number) { return apiRequest<{ request: ServiceRequest }>(`/api/service-requests/${id}`); }
export function cancelServiceRequest(id: number) { return apiRequest<{ request: ServiceRequest }>(`/api/service-requests/${id}/cancel`, { method: "PATCH" }); }
export function assignServiceRequest(id: number, employeeId: number) { return apiRequest<{ request: ServiceRequest }>(`/api/service-requests/${id}/assign`, { method: "PATCH", body: { employeeId } }); }
export function updateServiceRequestStatus(id: number, data: { status: ServiceRequestStatus; note?: string; municipalityResponse?: string }) { return apiRequest<{ request: ServiceRequest }>(`/api/service-requests/${id}/status`, { method: "PATCH", body: data }); }
