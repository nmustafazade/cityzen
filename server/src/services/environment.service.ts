import {
  EnvironmentalMetric,
  InfrastructureDataSource,
  UserRole,
} from "@prisma/client";
import database from "../config/database";
import type { AuthenticatedUser } from "../types/auth.types";
import { AppError } from "../utils/app-error";
const cache = new Map<string, { expires: number; value: unknown }>(),
  CACHE_MS = 15 * 60_000;
async function cachedJson(key: string, url: string) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Cityzen/1.0 environment" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Provider returned ${response.status}`);
    const value = await response.json();
    cache.set(key, { expires: Date.now() + CACHE_MS, value });
    return value;
  } finally {
    clearTimeout(timer);
  }
}
const rounded = (n: number) => n.toFixed(2);
export async function weather(latitude: number, longitude: number) {
  const key = `weather:${rounded(latitude)}:${rounded(longitude)}`;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=4&timezone=auto`;
  try {
    const data = (await cachedJson(key, url)) as Record<string, unknown>;
    return { ...data, source: "Open-Meteo", cachedForSeconds: CACHE_MS / 1000 };
  } catch {
    return {
      current: null,
      daily: null,
      source: "Open-Meteo",
      message: "Weather data is currently unavailable.",
    };
  }
}
export async function currentEnvironment(latitude: number, longitude: number) {
  if (process.env.OPEN_METEO_AIR_QUALITY_ENABLED === "false")
    return {
      airQuality: null,
      source: "Open-Meteo",
      message: "Air-quality provider is disabled.",
    };
  const key = `air:${rounded(latitude)}:${rounded(longitude)}`;
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm2_5,pm10,european_aqi,nitrogen_dioxide,ozone,carbon_monoxide,sulphur_dioxide&timezone=auto`;
  try {
    const data = (await cachedJson(key, url)) as {
      current?: Record<string, unknown>;
    };
    return {
      airQuality: data.current ?? null,
      temperature: null,
      humidity: null,
      noise: null,
      source: "Open-Meteo",
      measuredAt: data.current?.time ?? null,
      cachedForSeconds: CACHE_MS / 1000,
    };
  } catch {
    return {
      airQuality: null,
      temperature: null,
      humidity: null,
      noise: null,
      source: "Open-Meteo",
      message: "Air-quality data is currently unavailable.",
    };
  }
}
export async function stations() {
  return database.environmentalStation.findMany({
    where: { isActive: true },
    include: {
      department: { select: { id: true, name: true } },
      measurements: { orderBy: { measuredAt: "desc" }, take: 20 },
    },
    orderBy: { name: "asc" },
  });
}
export async function station(id: number) {
  const item = await database.environmentalStation.findFirst({
    where: { id, isActive: true },
    include: {
      department: { select: { id: true, name: true } },
      measurements: { orderBy: { measuredAt: "desc" }, take: 100 },
    },
  });
  if (!item) throw new AppError(404, "Environmental station not found");
  return item;
}
async function ownDepartment(user: AuthenticatedUser) {
  if (user.role === UserRole.ADMIN) return null;
  const account = await database.user.findUnique({
    where: { id: user.userId },
    select: { departmentId: true },
  });
  if (!account?.departmentId)
    throw new AppError(403, "Department assignment required");
  return account.departmentId;
}
export async function managedStations(user: AuthenticatedUser) {
  const own = await ownDepartment(user);
  return database.environmentalStation.findMany({
    where: {
      departmentId: user.role === UserRole.ADMIN ? undefined : own!,
      source: InfrastructureDataSource.MUNICIPALITY,
    },
    include: { department: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });
}
export async function saveStation(
  user: AuthenticatedUser,
  input: {
    id?: number;
    departmentId?: number | null;
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    isActive?: boolean;
  },
) {
  const own = await ownDepartment(user);
  if (input.id) {
    const current = await database.environmentalStation.findUnique({
      where: { id: input.id },
    });
    if (!current) throw new AppError(404, "Environmental station not found");
    if (current.source !== InfrastructureDataSource.MUNICIPALITY)
      throw new AppError(
        403,
        "External stations cannot be edited as municipality data",
      );
    if (user.role !== UserRole.ADMIN && current.departmentId !== own)
      throw new AppError(403, "You cannot manage this station");
    const { id, departmentId: _ignored, ...data } = input;
    return database.environmentalStation.update({
      where: { id },
      data: {
        ...data,
        departmentId:
          user.role === UserRole.ADMIN
            ? input.departmentId
            : current.departmentId,
      },
    });
  }
  const departmentId = user.role === UserRole.ADMIN ? input.departmentId : own;
  const { id: _id, ...data } = input;
  return database.environmentalStation.create({
    data: {
      ...data,
      departmentId,
      source: InfrastructureDataSource.MUNICIPALITY,
    },
  });
}
export async function addMeasurement(
  user: AuthenticatedUser,
  stationId: number,
  input: {
    metric: EnvironmentalMetric;
    value: number;
    unit: string;
    measuredAt: Date;
  },
) {
  const station = await database.environmentalStation.findUnique({
    where: { id: stationId },
  });
  if (!station) throw new AppError(404, "Environmental station not found");
  const own = await ownDepartment(user);
  if (user.role !== UserRole.ADMIN && station.departmentId !== own)
    throw new AppError(403, "You cannot manage this station");
  return database.environmentalMeasurement.create({
    data: {
      stationId,
      ...input,
      source: InfrastructureDataSource.MUNICIPALITY,
    },
  });
}
