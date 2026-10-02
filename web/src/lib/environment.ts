import { apiRequest } from "./api";
import type {
  EnvironmentCurrent,
  EnvironmentalStation,
  WeatherResponse,
} from "@/types/environment";
export const getWeather = (latitude: number, longitude: number) =>
  apiRequest<WeatherResponse>(
    `/api/weather?latitude=${latitude}&longitude=${longitude}`,
  );
export const getCurrentEnvironment = (latitude: number, longitude: number) =>
  apiRequest<EnvironmentCurrent>(
    `/api/environment/current?latitude=${latitude}&longitude=${longitude}`,
  );
export const getEnvironmentalStations = () =>
  apiRequest<{ stations: EnvironmentalStation[] }>("/api/environment/stations");
export const getManagedEnvironmentalStations = () =>
  apiRequest<{ stations: EnvironmentalStation[] }>(
    "/api/municipality/environment/stations",
  );
export const saveEnvironmentalStation = (data: object, id?: number) =>
  apiRequest(`/api/municipality/environment/stations${id ? `/${id}` : ""}`, {
    method: id ? "PATCH" : "POST",
    body: data,
  });
