import type { DepartmentSummary } from "./user";

export type RoadEventType = "ACCIDENT" | "ROAD_CLOSURE" | "CONSTRUCTION" | "MAINTENANCE" | "LANE_CLOSURE" | "FLOODING" | "CONGESTION" | "TEMPORARY_RESTRICTION" | "HAZARD" | "OTHER";
export type RoadEventSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type RoadEventStatus = "SCHEDULED" | "ACTIVE" | "RESOLVED" | "CANCELLED";
export type ParkingFacilityType = "STREET" | "GARAGE" | "LOT" | "UNDERGROUND";
export type ParkingReservationStatus = "RESERVED" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";
export type InfrastructureDataSource = "MUNICIPALITY" | "OPENSTREETMAP" | "OPEN_DATA" | "HERE" | "DEMO";
export interface Pagination { page: number; limit: number; total: number; totalPages: number; }
export interface SourceMetadata { source: InfrastructureDataSource; externalSourceId: string | null; sourceUrl: string | null; lastSyncedAt: string | null; }
export interface RoadEvent extends SourceMetadata { id: number; title: string; description: string; type: RoadEventType; severity: RoadEventSeverity; status: RoadEventStatus; address: string | null; latitude: string | number; longitude: string | number; startsAt: string; endsAt: string | null; isPublic: boolean; resolvedAt: string | null; createdAt: string; updatedAt: string; department: DepartmentSummary; }
export interface ParkingFacility extends SourceMetadata { id: number; name: string; description: string | null; type: ParkingFacilityType; address: string; latitude: string | number; longitude: string | number; totalSpaces: number; availableSpaces: number | null; accessibleSpaces: number; evChargingSpaces: number; hourlyPrice: string | number | null; currency: string | null; openingHours: string | null; supportsReservation: boolean; isActive: boolean; department: DepartmentSummary; }
export interface FacilityCategory { id: number; name: string; icon: string | null; description: string | null; isActive: boolean; }
export interface CityFacility extends SourceMetadata { id: number; name: string; description: string | null; address: string; latitude: string | number; longitude: string | number; phone: string | null; email: string | null; website: string | null; openingHours: string | null; isActive: boolean; category: FacilityCategory; department: DepartmentSummary | null; }
export interface ExternalTrafficEvent { externalId: string; source: InfrastructureDataSource; title: string; description: string; type: RoadEventType; severity: RoadEventSeverity; latitude: number; longitude: number; startsAt: string; endsAt: string | null; sourceUrl?: string; isLive: boolean; }
export interface ParkingReservation { id: number; startsAt: string; endsAt: string; status: ParkingReservationStatus; cancelledAt: string | null; createdAt: string; parkingFacility: ParkingFacility; }
export const roadTypeLabels: Record<RoadEventType, string> = { ACCIDENT: "Accident", ROAD_CLOSURE: "Road Closure", CONSTRUCTION: "Construction", MAINTENANCE: "Maintenance", LANE_CLOSURE: "Lane Closure", FLOODING: "Flooding", CONGESTION: "Congestion", TEMPORARY_RESTRICTION: "Temporary Restriction", HAZARD: "Hazard", OTHER: "Other" };
export const roadSeverityLabels: Record<RoadEventSeverity, string> = { LOW: "Low", MODERATE: "Moderate", HIGH: "High", CRITICAL: "Critical" };
export const roadStatusLabels: Record<RoadEventStatus, string> = { SCHEDULED: "Scheduled", ACTIVE: "Active", RESOLVED: "Resolved", CANCELLED: "Cancelled" };
export const parkingTypeLabels: Record<ParkingFacilityType, string> = { STREET: "Street", GARAGE: "Garage", LOT: "Lot", UNDERGROUND: "Underground" };
export const reservationStatusLabels: Record<ParkingReservationStatus, string> = { RESERVED: "Reserved", ACTIVE: "Active", COMPLETED: "Completed", CANCELLED: "Cancelled", EXPIRED: "Expired" };
export const sourceLabels: Record<InfrastructureDataSource, string> = { MUNICIPALITY: "Municipality", OPENSTREETMAP: "OpenStreetMap", OPEN_DATA: "City Open Data", HERE: "Live traffic provider", DEMO: "Demo Data" };
