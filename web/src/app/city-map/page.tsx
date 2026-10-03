"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  Check,
  CircleParking,
  CloudSun,
  FileText,
  LocateFixed,
  MapPinned,
  Recycle,
  Search,
} from "lucide-react";
import {
  InfrastructureMap,
  type InfrastructureMarker,
} from "@/components/maps/InfrastructureMap";
import { getEnvironmentalStations } from "@/lib/environment";
import { getAlerts } from "@/lib/emergency";
import {
  getFacilities,
  getParkingFacilities,
  getTraffic,
} from "@/lib/infrastructure";
import { getWasteFacilities } from "@/lib/waste";
import { getPublicReports } from "@/lib/community";
import type { EnvironmentalStation } from "@/types/environment";
import type { EmergencyAlert } from "@/types/emergency";
import type {
  CityFacility,
  ExternalTrafficEvent,
  ParkingFacility,
  RoadEvent,
} from "@/types/infrastructure";
import {
  roadSeverityLabels,
  roadTypeLabels,
  sourceLabels,
} from "@/types/infrastructure";
import type { WasteFacility } from "@/types/waste";
import { wasteFacilityLabels } from "@/types/waste";
import type { PublicReport } from "@/types/community";
type TrafficItem = RoadEvent | ExternalTrafficEvent;
type Layer =
  | "roads"
  | "parking"
  | "facilities"
  | "waste"
  | "environment"
  | "issues"
  | "alerts";
const layerInfo: {
  key: Layer;
  label: string;
  icon: typeof MapPinned;
  color: string;
}[] = [
  {
    key: "roads",
    label: "Road Conditions",
    icon: AlertTriangle,
    color: "bg-rose-500",
  },
  {
    key: "parking",
    label: "Parking",
    icon: CircleParking,
    color: "bg-blue-500",
  },
  {
    key: "facilities",
    label: "Facilities",
    icon: MapPinned,
    color: "bg-emerald-500",
  },
  {
    key: "waste",
    label: "Waste & Recycling",
    icon: Recycle,
    color: "bg-lime-600",
  },
  {
    key: "environment",
    label: "Environment",
    icon: CloudSun,
    color: "bg-cyan-500",
  },
  {
    key: "issues",
    label: "Public Issues",
    icon: FileText,
    color: "bg-violet-500",
  },
  {
    key: "alerts",
    label: "Emergency Alerts",
    icon: BellRing,
    color: "bg-amber-500",
  },
];
export default function CityMapPage() {
  const [roads, setRoads] = useState<TrafficItem[]>([]),
    [parking, setParking] = useState<ParkingFacility[]>([]),
    [facilities, setFacilities] = useState<CityFacility[]>([]),
    [waste, setWaste] = useState<WasteFacility[]>([]),
    [stations, setStations] = useState<EnvironmentalStation[]>([]),
    [issues, setIssues] = useState<PublicReport[]>([]),
    [alerts, setAlerts] = useState<EmergencyAlert[]>([]),
    [layers, setLayers] = useState<Record<Layer, boolean>>({
      roads: true,
      parking: true,
      facilities: true,
      waste: false,
      environment: false,
      issues: true,
      alerts: true,
    }),
    [center, setCenter] = useState<[number, number] | undefined>(),
    [locating, setLocating] = useState(false),
    [query, setQuery] = useState(""),
    [error, setError] = useState("");
  const [loadingLayers, setLoadingLayers] = useState<Layer[]>(
    layerInfo.map((l) => l.key),
  );
  const [failedLayers, setFailedLayers] = useState<Layer[]>([]);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    async function load<T>(
      key: Layer,
      request: Promise<T>,
      save: (data: T) => void,
    ) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const data = await Promise.race([
          request,
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error("Timed out")), 15000);
          }),
        ]);
        if (active) save(data);
      } catch {
        if (active) setFailedLayers((previous) => [...previous, key]);
      } finally {
        clearTimeout(timer);
        if (active)
          setLoadingLayers((previous) =>
            previous.filter((layer) => layer !== key),
          );
      }
    }
    void load("roads", getTraffic(), (r) =>
      setRoads([...r.stored, ...r.external]),
    );
    void load("parking", getParkingFacilities({ limit: 100 }), (r) =>
      setParking(r.parking),
    );
    void load("facilities", getFacilities({ limit: 100 }), (r) =>
      setFacilities(r.facilities),
    );
    void load("waste", getWasteFacilities({ limit: 100 }), (r) =>
      setWaste(r.facilities),
    );
    void load("environment", getEnvironmentalStations(), (r) =>
      setStations(r.stations),
    );
    void load("issues", getPublicReports({ limit: 100 }), (r) =>
      setIssues(r.reports),
    );
    void load("alerts", getAlerts(), (r) => setAlerts(r.alerts));
    return () => {
      active = false;
    };
  }, [attempt]);
  const markers = useMemo<InfrastructureMarker[]>(
    () =>
      [
        ...(layers.roads
          ? roads.map((x, i) => ({
              id: `r${"id" in x ? x.id : x.externalId}-${i}`,
              latitude: Number(x.latitude),
              longitude: Number(x.longitude),
              title: x.title,
              detail: `${roadTypeLabels[x.type]} · ${roadSeverityLabels[x.severity]} · ${sourceLabels[x.source]}`,
              href: "id" in x ? `/roads/${x.id}` : x.sourceUrl || "/roads",
              kind: "road" as const,
            }))
          : []),
        ...(layers.parking
          ? parking.map((x) => ({
              id: `p${x.id}`,
              latitude: Number(x.latitude),
              longitude: Number(x.longitude),
              title: x.name,
              detail:
                x.availableSpaces === null
                  ? "Availability unavailable"
                  : `${x.availableSpaces}/${x.totalSpaces} spaces`,
              href: `/parking/${x.id}`,
              kind: "parking" as const,
            }))
          : []),
        ...(layers.facilities
          ? facilities.map((x) => ({
              id: `f${x.id}`,
              latitude: Number(x.latitude),
              longitude: Number(x.longitude),
              title: x.name,
              detail: x.category.name,
              href: `/facilities/${x.id}`,
              kind: "facility" as const,
            }))
          : []),
        ...(layers.waste
          ? waste.map((x) => ({
              id: `w${x.id}`,
              latitude: Number(x.latitude),
              longitude: Number(x.longitude),
              title: x.name || wasteFacilityLabels[x.type],
              detail: wasteFacilityLabels[x.type],
              href: "/waste",
              kind: "waste" as const,
            }))
          : []),
        ...(layers.environment
          ? stations.map((x) => ({
              id: `e${x.id}`,
              latitude: Number(x.latitude),
              longitude: Number(x.longitude),
              title: x.name,
              detail: "Environmental monitoring station",
              href: "/environment",
              kind: "environment" as const,
            }))
          : []),
        ...(layers.issues
          ? issues
              .filter((x) => x.latitude != null && x.longitude != null)
              .map((x) => ({
                id: `i${x.id}`,
                latitude: Number(x.latitude),
                longitude: Number(x.longitude),
                title: x.title,
                detail: `${x.category.name} · ${x.status.replaceAll("_", " ")}`,
                href: `/community/reports/${x.id}`,
                kind: "issue" as const,
              }))
          : []),
        ...(layers.alerts
          ? alerts
              .filter((x) => x.latitude != null && x.longitude != null)
              .map((x) => ({
                id: `a${x.id}`,
                latitude: Number(x.latitude),
                longitude: Number(x.longitude),
                title: x.title,
                detail: `${x.severity} emergency alert`,
                href: `/alerts/${x.id}`,
                kind: "alert" as const,
              }))
          : []),
      ].filter(
        (x) =>
          Number.isFinite(x.latitude) &&
          Math.abs(x.latitude) <= 90 &&
          Number.isFinite(x.longitude) &&
          Math.abs(x.longitude) <= 180 &&
          `${x.title} ${x.detail}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [
      roads,
      parking,
      facilities,
      waste,
      stations,
      issues,
      alerts,
      layers,
      query,
    ],
  );
  const locate = () => {
    if (!navigator.geolocation)
      return setError("Location is unavailable in this browser.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCenter([p.coords.latitude, p.coords.longitude]);
        setLocating(false);
      },
      () => {
        setError(
          "Location permission was denied. You can still browse the map manually.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };
  return (
    <main className="bg-slate-100 lg:h-[calc(100vh-72px)] lg:min-h-[680px] lg:overflow-hidden">
      <div className="grid h-full lg:grid-cols-[330px_1fr]">
        <aside className="z-10 overflow-y-auto border-r border-slate-200 bg-white p-5 shadow-xl">
          <p className="city-eyebrow">Explore Cityzen</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            City Map
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Explore city information. Switch layers on or off to show or hide
            Cityzen markers.
          </p>
          <label className="relative mt-6 block">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={17}
            />
            <span className="sr-only">Search map results</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search enabled layers"
              aria-describedby="map-search-help"
              className="w-full py-2.5 pl-10 pr-3 text-sm"
            />
          </label>
          <p id="map-search-help" className="mt-2 text-xs text-slate-500">
            Search loaded places and events by name or category in enabled
            layers. This is not a street/address search. Base-map labels always
            remain visible.
          </p>
          {query && (
            <button
              className="mt-2 text-sm underline"
              onClick={() => setQuery("")}
            >
              Clear search
            </button>
          )}
          <div className="mt-7">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Map layers
            </p>
            <div className="mt-3 space-y-1">
              {layerInfo.map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => setLayers((v) => ({ ...v, [key]: !v[key] }))}
                  aria-pressed={layers[key]}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm font-bold ${layers[key] ? "bg-slate-100 text-slate-950" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <span
                    className={`grid size-9 place-items-center rounded-lg text-white ${color}`}
                  >
                    <Icon size={17} />
                  </span>
                  <span>
                    {label}
                    {loadingLayers.includes(key) ? (
                      <small className="block font-normal">Loading…</small>
                    ) : failedLayers.includes(key) ? (
                      <small className="block font-normal text-rose-700">
                        Unavailable
                      </small>
                    ) : null}
                  </span>
                  <span
                    className={`ml-auto grid size-5 place-items-center rounded-md border ${layers[key] ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300"}`}
                  >
                    {layers[key] && <Check size={13} />}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={locate}
            disabled={locating}
            className="action-secondary mt-6 w-full"
          >
            <LocateFixed size={17} />
            {locating ? "Finding location..." : "Use my location"}
          </button>
          {failedLayers.length > 0 && (
            <div role="alert" className="mt-4 text-sm text-rose-700">
              Some layers could not load. Check the backend connection.
              <button
                className="ml-2 underline"
                disabled={loadingLayers.length > 0}
                onClick={() => {
                  setFailedLayers([]);
                  setLoadingLayers(layerInfo.map((l) => l.key));
                  setAttempt((v) => v + 1);
                }}
              >
                Retry layers
              </button>
            </div>
          )}
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700"
            >
              {error}
            </p>
          )}
          <div className="mt-7 flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Results
            </p>
            <span role="status" className="text-xs font-bold text-slate-500">
              {markers.length} markers
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {!markers.length && (
              <p className="text-sm text-slate-500">
                {loadingLayers.length
                  ? "Loading map data…"
                  : !Object.values(layers).some(Boolean)
                    ? "All layers are off. Enable a layer to see markers."
                    : query.trim()
                      ? "No matching markers. Try another search or enable more layers."
                      : "No locations in the enabled layers."}
              </p>
            )}
            {markers.slice(0, 8).map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-xl border border-slate-100 p-3 hover:border-teal-200 hover:bg-teal-50"
              >
                <p className="text-sm font-extrabold">{item.title}</p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                  {item.detail}
                </p>
              </Link>
            ))}
          </div>
        </aside>
        <section className="relative min-h-[480px]">
          <div className="absolute inset-0 [&>div]:h-full [&_.leaflet-container]:!h-full [&>div]:!rounded-none [&>div]:!border-0">
            <InfrastructureMap markers={markers} center={center} fitResults />
          </div>
          <div className="absolute bottom-4 right-4 z-[500] rounded-lg bg-white/95 px-3 py-2 text-[10px] font-semibold text-slate-500 shadow-lg">
            © OpenStreetMap contributors · External data may be incomplete
          </div>
        </section>
      </div>
    </main>
  );
}
