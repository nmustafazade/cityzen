"use client";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { reportMarkerIcon } from "./leaflet-icon";
import type { PublicReport } from "@/types/community";
export default function CommunityReportMapCanvas({
  reports,
}: {
  reports: PublicReport[];
}) {
  const points = reports.filter(
    (report) => report.latitude != null && report.longitude != null,
  );
  const center: [number, number] = points.length
    ? [Number(points[0].latitude), Number(points[0].longitude)]
    : [40.4093, 49.8671];
  return (
    <MapContainer center={center} zoom={12} className="h-[560px] w-full">
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((report) => (
        <Marker
          key={report.id}
          position={[Number(report.latitude), Number(report.longitude)]}
          icon={reportMarkerIcon}
        >
          <Popup>
            <strong>{report.title}</strong>
            <br />
            {report.category.name}
            <br />
            <Link href={`/community/reports/${report.id}`}>View issue</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
