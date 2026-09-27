import type { ParkingFacilityType, RoadEventSeverity, RoadEventStatus, RoadEventType } from "@prisma/client";

export interface PageOptions { page: number; limit: number; departmentId?: number; search?: string; }
export interface Bounds { north?: number; south?: number; east?: number; west?: number; }
export interface RoadEventFilters extends PageOptions, Bounds { type?: RoadEventType; severity?: RoadEventSeverity; status?: RoadEventStatus; from?: Date; to?: Date; }
export interface ParkingFilters extends PageOptions, Bounds { type?: ParkingFacilityType; hasAvailableSpaces?: boolean; supportsReservation?: boolean; hasEVCharging?: boolean; hasAccessibleParking?: boolean; }
export interface FacilityFilters extends PageOptions, Bounds { categoryId?: number; }
export interface RoadEventInput { departmentId?: number; title: string; description: string; type: RoadEventType; severity: RoadEventSeverity; status: RoadEventStatus; address?: string | null; latitude: number; longitude: number; startsAt: Date; endsAt?: Date | null; isPublic?: boolean; }
export interface ParkingInput { departmentId?: number; name: string; description?: string | null; type: ParkingFacilityType; address: string; latitude: number; longitude: number; totalSpaces: number; availableSpaces: number | null; accessibleSpaces: number; evChargingSpaces: number; hourlyPrice?: number | null; currency?: string | null; openingHours?: string | null; supportsReservation?: boolean; isActive?: boolean; }
export interface FacilityInput { departmentId?: number | null; categoryId: number; name: string; description?: string | null; address: string; latitude: number; longitude: number; phone?: string | null; email?: string | null; website?: string | null; openingHours?: string | null; isActive?: boolean; }
