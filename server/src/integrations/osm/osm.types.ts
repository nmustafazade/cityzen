export interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface OverpassResponse {
  elements: OsmElement[];
}
export interface ImportBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}
export interface ImportStats {
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
}
