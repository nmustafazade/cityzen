"use client";
import Link from "next/link";
import { MunicipalityRoute } from "@/components/auth/ProtectedRoute";
const cards = [
  ["Waste Zones", "/municipality/waste/zones"],
  ["Collection Schedules", "/municipality/waste/schedules"],
  ["Waste Facilities", "/municipality/waste/facilities"],
  ["Environmental Stations", "/municipality/environment/stations"],
  ["Emergency Alerts", "/municipality/emergency-alerts"],
];
export default function Page() {
  return (
    <MunicipalityRoute>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold">Environment, Waste & Safety</h1>
        <p className="mt-2 text-slate-600">
          Manage department resources and public information.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {cards.map(([title, href]) => (
            <Link
              key={title}
              href={href}
              className="rounded-2xl border bg-white p-6 text-lg font-bold shadow-sm"
            >
              {title}
              <span className="mt-4 block text-sm text-emerald-700">
                Manage →
              </span>
            </Link>
          ))}
        </div>
      </main>
    </MunicipalityRoute>
  );
}
