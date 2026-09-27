import { InfrastructureDataSource, RoadEventSeverity, RoadEventType } from "@prisma/client";
import database from "../config/database";
import type { ImportBounds } from "../integrations/osm/osm.types";
import { HereRoadEventProvider, OpenDataRoadEventProvider } from "../integrations/traffic/providers";
import type { ExternalRoadEvent, TrafficDataProvider } from "../integrations/traffic/traffic.types";

const providers: TrafficDataProvider[] = [new OpenDataRoadEventProvider(), new HereRoadEventProvider()];
const cache = new Map<string, { expiresAt: number; events: ExternalRoadEvent[] }>();
const CACHE_MS = 5 * 60_000;
const key = (bounds: ImportBounds) => Object.values(bounds).map((value) => value.toFixed(3)).join(":");

async function externalTraffic(bounds: ImportBounds) {
  const cacheKey = key(bounds), existing = cache.get(cacheKey);
  if (existing && existing.expiresAt > Date.now()) return existing.events;
  const events: ExternalRoadEvent[] = [];
  for (const provider of providers) {
    if (!provider.enabled()) continue;
    try { events.push(...await provider.fetchRoadEvents(bounds)); } catch (error) { console.warn(`${provider.name} traffic fetch failed:`, error instanceof Error ? error.message : "unknown error"); }
  }
  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_MS, events });
  return events;
}

export async function getAggregatedTraffic(bounds: ImportBounds) {
  const stored = await database.roadEvent.findMany({ where: { isPublic: true, status: { in: ["ACTIVE", "SCHEDULED"] }, latitude: { gte: bounds.south, lte: bounds.north }, longitude: { gte: bounds.west, lte: bounds.east }, source: process.env.ENABLE_INFRASTRUCTURE_DEMO_DATA === "true" ? undefined : { not: InfrastructureDataSource.DEMO } }, include: { department: { select: { id: true, name: true } } }, orderBy: { startsAt: "desc" }, take: 500 });
  const external = await externalTraffic(bounds);
  if (stored.length || external.length || process.env.ENABLE_INFRASTRUCTURE_DEMO_DATA !== "true") return { stored, external, cachedForSeconds: CACHE_MS / 1000 };
  const latitude = (bounds.north + bounds.south) / 2, longitude = (bounds.east + bounds.west) / 2;
  return { stored, external: [{ externalId: "demo-construction", source: InfrastructureDataSource.DEMO, title: "Sample road construction", description: "Demo data shown because no configured source returned road conditions.", type: RoadEventType.CONSTRUCTION, severity: RoadEventSeverity.MODERATE, latitude, longitude, startsAt: new Date().toISOString(), endsAt: null, isLive: false }], cachedForSeconds: CACHE_MS / 1000 };
}
