import type { ImportBounds, OverpassResponse } from "./osm.types";

const DEFAULT_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "Cityzen/1.0 infrastructure-import";

export async function queryOverpass(query: string): Promise<OverpassResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(process.env.OVERPASS_API_URL || DEFAULT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": USER_AGENT, Accept: "application/json" },
      body: new URLSearchParams({ data: query }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Overpass request failed with status ${response.status}`);
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !Array.isArray((data as OverpassResponse).elements)) throw new Error("Overpass returned an invalid response");
    return data as OverpassResponse;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("Overpass request timed out");
    throw error instanceof Error ? error : new Error("Overpass request failed");
  } finally { clearTimeout(timeout); }
}

export const bbox = (bounds: ImportBounds) => `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
