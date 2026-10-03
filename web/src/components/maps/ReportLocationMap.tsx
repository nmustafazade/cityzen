"use client";

import dynamic from "next/dynamic";

import type { Coordinates } from "@/types/location";

const ReportLocationMapCanvas = dynamic(
  () => import("./ReportLocationMapCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">
        Loading map...
      </div>
    ),
  },
);

export function ReportLocationMap({
  coordinates,
  title = "report",
}: {
  coordinates: Coordinates;
  title?: string;
}) {
  return (
    <div
      role="region"
      aria-label={`Map showing the location of ${title}`}
      className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
    >
      <ReportLocationMapCanvas coordinates={coordinates} />
    </div>
  );
}
