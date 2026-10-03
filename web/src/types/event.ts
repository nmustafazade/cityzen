import type { Department } from "./department";
export interface CityEvent {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  location?: string | null;
  locationName: string | null;
  address: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  startsAt: string;
  endsAt: string | null;
  externalUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  department: Pick<Department, "id" | "name"> | null;
}
export interface CityEventInput {
  departmentId?: number | null;
  title: string;
  description: string;
  locationName?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  startsAt: string;
  endsAt?: string | null;
  externalUrl?: string | null;
  isPublished?: boolean;
}
