"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { InfrastructureMarker } from "./InfrastructureMap";

const colors = {
  road: "#dc2626",
  parking: "#2563eb",
  facility: "#059669",
  waste: "#65a30d",
  environment: "#06b6d4",
  issue: "#8b5cf6",
  alert: "#f59e0b",
} as const;
function ViewController({ markers, center, fitResults }: { markers: InfrastructureMarker[]; center?: [number, number]; fitResults: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (fitResults && markers.length) {
      map.fitBounds(markers.map(m => [m.latitude, m.longitude] as [number, number]), { padding: [35, 35], maxZoom: 15 });
    }
  }, [map, markers, fitResults]);
  useEffect(() => {
    if (center) map.setView(center, 15);
  }, [map, center]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}
export default function InfrastructureMapCanvas({
  markers,
  center,
  fitResults = false,
}: {
  markers: InfrastructureMarker[];
  center?: [number, number];
  fitResults?: boolean;
}) {
  return (
    <MapContainer
      center={center ?? [40.4093, 49.8671]}
      zoom={13}
      scrollWheelZoom
      className="h-[430px] w-full"
    >
      <ViewController markers={markers} center={center} fitResults={fitResults} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.latitude, marker.longitude]}
          radius={9}
          pathOptions={{
            color: colors[marker.kind],
            fillColor: colors[marker.kind],
            fillOpacity: 0.75,
          }}
        >
          <Popup>
            <strong>{marker.title}</strong>
            <p>{marker.detail}</p>
            <Link href={marker.href}>View details</Link>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
