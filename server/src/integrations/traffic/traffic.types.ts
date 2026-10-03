import type {
  InfrastructureDataSource,
  RoadEventSeverity,
  RoadEventType,
} from "@prisma/client";
import type { ImportBounds } from "../osm/osm.types";

export interface ExternalRoadEvent {
  externalId: string;
  source: InfrastructureDataSource;
  title: string;
  description: string;
  type: RoadEventType;
  severity: RoadEventSeverity;
  latitude: number;
  longitude: number;
  startsAt: string;
  endsAt: string | null;
  sourceUrl?: string;
  isLive: boolean;
}
export interface TrafficDataProvider {
  readonly name: string;
  enabled(): boolean;
  fetchRoadEvents(bounds: ImportBounds): Promise<ExternalRoadEvent[]>;
}
