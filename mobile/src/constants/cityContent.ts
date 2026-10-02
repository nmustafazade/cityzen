export const cityContent = {
  announcements: { endpoint: "/api/announcements", key: "announcement", label: "Announcement" },
  events: { endpoint: "/api/events", key: "event", label: "Event" },
  facilities: { endpoint: "/api/infrastructure/facilities", key: "facility", label: "Facility" },
  parking: { endpoint: "/api/infrastructure/parking", key: "parking", label: "Parking" },
  roads: { endpoint: "/api/infrastructure/road-events", key: "roadEvent", label: "Road Condition" },
  waste: { endpoint: "/api/waste/facilities", key: "facility", label: "Waste Facility" },
  alerts: { endpoint: "/api/emergency-alerts", key: "alert", label: "City Alert" },
  community: { endpoint: "/api/public/reports", key: "report", label: "Community Report" },
} as const;
export type CityContentKind = keyof typeof cityContent;
export function contentKind(path: string): CityContentKind | undefined {
  return (Object.keys(cityContent) as CityContentKind[]).find(kind => cityContent[kind].endpoint === path.split("?")[0]);
}
