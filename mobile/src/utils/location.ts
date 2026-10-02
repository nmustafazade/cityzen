export type CoordinateValue = string | number | null | undefined;
export type Coordinates = { latitude: number; longitude: number };

export function parseCoordinates(latitude: CoordinateValue, longitude: CoordinateValue): Coordinates | null {
  const number = (value: CoordinateValue) => {
    if (value == null || (typeof value === "string" && !value.trim())) return NaN;
    return Number(value);
  };
  const lat = number(latitude), lon = number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { latitude: lat, longitude: lon };
}
