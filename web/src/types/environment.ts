import type { DepartmentSummary } from "./user";
import type { InfrastructureDataSource } from "./infrastructure";
export interface EnvironmentalMeasurement {
  id: number;
  metric:
    | "PM25"
    | "PM10"
    | "AQI"
    | "TEMPERATURE"
    | "HUMIDITY"
    | "NO2"
    | "O3"
    | "CO"
    | "SO2"
    | "NOISE_DB";
  value: string | number;
  unit: string;
  measuredAt: string;
  source: InfrastructureDataSource;
}
export interface EnvironmentalStation {
  id: number;
  name: string;
  description: string | null;
  latitude: string | number;
  longitude: string | number;
  address: string | null;
  source: InfrastructureDataSource;
  lastSyncedAt: string | null;
  department: DepartmentSummary | null;
  measurements: EnvironmentalMeasurement[];
}
export interface WeatherResponse {
  current: Record<string, number | string> | null;
  daily: Record<string, unknown> | null;
  source: string;
  message?: string;
}
export interface EnvironmentCurrent {
  airQuality: Record<string, number | string> | null;
  temperature: number | null;
  humidity: number | null;
  noise: null;
  source: string;
  measuredAt: string | null;
  message?: string;
}
