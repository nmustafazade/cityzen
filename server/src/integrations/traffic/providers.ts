import {
  InfrastructureDataSource,
  RoadEventSeverity,
  RoadEventType,
} from "@prisma/client";
import type { ImportBounds } from "../osm/osm.types";
import type { ExternalRoadEvent, TrafficDataProvider } from "./traffic.types";

async function json(url: string, headers: Record<string, string> = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Cityzen/1.0 traffic-provider",
        ...headers,
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Provider returned ${response.status}`);
    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}
const severity = (value: unknown) => {
  const text = String(value || "").toUpperCase();
  if (text.includes("CRITICAL") || text.includes("MAJOR"))
    return RoadEventSeverity.CRITICAL;
  if (text.includes("HIGH") || text.includes("SEVERE"))
    return RoadEventSeverity.HIGH;
  if (text.includes("LOW") || text.includes("MINOR"))
    return RoadEventSeverity.LOW;
  return RoadEventSeverity.MODERATE;
};
const type = (value: unknown) => {
  const text = String(value || "").toUpperCase();
  if (text.includes("ACCIDENT") || text.includes("COLLISION"))
    return RoadEventType.ACCIDENT;
  if (text.includes("CLOS")) return RoadEventType.ROAD_CLOSURE;
  if (text.includes("CONSTRUCTION") || text.includes("ROADWORK"))
    return RoadEventType.CONSTRUCTION;
  if (text.includes("CONGEST") || text.includes("JAM"))
    return RoadEventType.CONGESTION;
  if (text.includes("FLOOD")) return RoadEventType.FLOODING;
  return RoadEventType.OTHER;
};
const date = (value: unknown) => {
  const parsed = typeof value === "string" ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
};

export class OpenDataRoadEventProvider implements TrafficDataProvider {
  readonly name = "City Open Data";
  enabled() {
    return Boolean(process.env.TRAFFIC_OPEN_DATA_URL);
  }
  async fetchRoadEvents(_bounds: ImportBounds): Promise<ExternalRoadEvent[]> {
    const payload = await json(process.env.TRAFFIC_OPEN_DATA_URL!);
    const features =
      payload &&
      typeof payload === "object" &&
      Array.isArray((payload as { features?: unknown[] }).features)
        ? (payload as { features: Array<Record<string, unknown>> }).features
        : [];
    return features.flatMap((feature, index) => {
      const geometry = feature.geometry as
        { type?: string; coordinates?: unknown[] } | undefined;
      const properties = (feature.properties || {}) as Record<string, unknown>;
      if (geometry?.type !== "Point" || !Array.isArray(geometry.coordinates))
        return [];
      const longitude = Number(geometry.coordinates[0]),
        latitude = Number(geometry.coordinates[1]);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
      return [
        {
          externalId: String(feature.id || properties.id || index),
          source: InfrastructureDataSource.OPEN_DATA,
          title: String(properties.title || properties.name || "Road incident"),
          description: String(
            properties.description ||
              properties.summary ||
              "Published by an open-government traffic feed.",
          ),
          type: type(properties.type || properties.category),
          severity: severity(properties.severity),
          latitude,
          longitude,
          startsAt: date(properties.startsAt || properties.start_date),
          endsAt:
            properties.endsAt || properties.end_date
              ? date(properties.endsAt || properties.end_date)
              : null,
          sourceUrl:
            typeof properties.url === "string"
              ? properties.url
              : process.env.TRAFFIC_OPEN_DATA_URL,
          isLive: false,
        },
      ];
    });
  }
}

export class HereRoadEventProvider implements TrafficDataProvider {
  readonly name = "HERE Traffic";
  enabled() {
    return Boolean(process.env.HERE_API_KEY);
  }
  async fetchRoadEvents(bounds: ImportBounds): Promise<ExternalRoadEvent[]> {
    const box = `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
    const payload = await json(
      `https://data.traffic.hereapi.com/v7/incidents?in=bbox:${box}&locationReferencing=shape&apiKey=${encodeURIComponent(process.env.HERE_API_KEY!)}`,
    );
    const results =
      payload &&
      typeof payload === "object" &&
      Array.isArray((payload as { results?: unknown[] }).results)
        ? (payload as { results: Array<Record<string, unknown>> }).results
        : [];
    return results.flatMap((item, index) => {
      const location = item.location as
        | {
            shape?: {
              links?: Array<{ points?: Array<{ lat?: number; lng?: number }> }>;
            };
          }
        | undefined;
      const point = location?.shape?.links?.[0]?.points?.[0];
      const details = (item.incidentDetails || {}) as Record<string, unknown>;
      if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng))
        return [];
      return [
        {
          externalId: String(item.incidentId || index),
          source: InfrastructureDataSource.HERE,
          title: String(details.description || "Traffic incident"),
          description: String(
            details.description ||
              "Current incident from the configured traffic provider.",
          ),
          type: type(details.type || details.criticality),
          severity: severity(details.criticality),
          latitude: point.lat!,
          longitude: point.lng!,
          startsAt: date(details.startTime),
          endsAt: details.endTime ? date(details.endTime) : null,
          isLive: true,
        },
      ];
    });
  }
}
