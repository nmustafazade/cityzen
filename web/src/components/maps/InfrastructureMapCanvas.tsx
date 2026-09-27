"use client";

import Link from "next/link";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { InfrastructureMarker } from "./InfrastructureMap";

const colors = { road: "#dc2626", parking: "#2563eb", facility: "#059669" } as const;
export default function InfrastructureMapCanvas({ markers, center = [40.4093, 49.8671] }: { markers: InfrastructureMarker[]; center?: [number, number] }) {
  return <MapContainer center={center} zoom={13} scrollWheelZoom className="h-[430px] w-full"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{markers.map((marker) => <CircleMarker key={marker.id} center={[marker.latitude, marker.longitude]} radius={9} pathOptions={{ color: colors[marker.kind], fillColor: colors[marker.kind], fillOpacity: 0.75 }}><Popup><strong>{marker.title}</strong><p>{marker.detail}</p><Link href={marker.href}>View details</Link></Popup></CircleMarker>)}</MapContainer>;
}
