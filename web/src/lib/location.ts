import type { Coordinates } from "@/types/location";

// Development fallback used only to center an unselected map.
export const FALLBACK_MAP_CENTER: Coordinates = {
  latitude: 40.4093,
  longitude: 49.8671,
};

export function coordinatesFromValues(
  latitude: string | number | null | undefined,
  longitude: string | number | null | undefined,
): Coordinates | null {
  if (latitude === null || latitude === undefined || latitude === "") return null;
  if (longitude === null || longitude === undefined || longitude === "") return null;

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  if (
    !Number.isFinite(parsedLatitude) ||
    !Number.isFinite(parsedLongitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return null;
  }

  return { latitude: parsedLatitude, longitude: parsedLongitude };
}

export function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

export function geolocationErrorMessage(code: number): string {
  if (code === 1) {
    return "Location permission was denied. You can select the location manually on the map.";
  }
  if (code === 2) return "Your browser could not determine your location.";
  if (code === 3) return "Finding your location took too long. Please try again or select it manually.";
  return "Your location could not be retrieved. You can select it manually on the map.";
}
