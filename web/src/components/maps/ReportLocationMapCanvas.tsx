"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";

import { reportMarkerIcon } from "@/components/maps/leaflet-icon";
import type { Coordinates } from "@/types/location";

export default function ReportLocationMapCanvas({ coordinates }: { coordinates: Coordinates }) {
  return (
    <MapContainer center={[coordinates.latitude, coordinates.longitude]} zoom={16} scrollWheelZoom className="h-[320px] w-full rounded-xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[coordinates.latitude, coordinates.longitude]} icon={reportMarkerIcon} />
    </MapContainer>
  );
}
