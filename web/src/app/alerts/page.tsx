"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  InfrastructureShell,
  StateMessage,
} from "@/components/infrastructure/InfrastructureShell";
import { getAlerts } from "@/lib/emergency";
import { formatDateTime } from "@/lib/format";
import type { EmergencyAlert, EmergencySeverity } from "@/types/emergency";
import { severityLabels } from "@/types/emergency";
export default function AlertsPage() {
  const [items, setItems] = useState<EmergencyAlert[]>([]),
    [severity, setSeverity] = useState<EmergencySeverity | "">(""),
    [error, setError] = useState("");
  useEffect(() => {
    getAlerts(severity || undefined)
      .then((r) => setItems(r.alerts))
      .catch((e: Error) => setError(e.message));
  }, [severity]);
  return (
    <InfrastructureShell
      title="City Alerts"
      subtitle="Current municipality emergency and public-safety information."
    >
      <div className="mt-7 flex flex-wrap gap-2">
        {["", ...Object.keys(severityLabels)].map((value) => (
          <button
            key={value || "ALL"}
            onClick={() => setSeverity(value as EmergencySeverity | "")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${severity === value ? "bg-slate-900 text-white" : "border bg-white"}`}
          >
            {value ? severityLabels[value as EmergencySeverity] : "All"}
          </button>
        ))}
      </div>
      {error ? (
        <StateMessage>{error}</StateMessage>
      ) : !items.length ? (
        <StateMessage>No active city alerts.</StateMessage>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((alert) => (
            <article
              key={alert.id}
              className={`rounded-2xl border p-6 ${alert.severity === "CRITICAL" ? "border-rose-300 bg-rose-50" : "bg-white"}`}
            >
              <div className="flex justify-between gap-4">
                <span className="font-bold uppercase text-rose-700">
                  {severityLabels[alert.severity]}
                </span>
                <span className="text-xs text-slate-500">
                  {alert.department?.name || "Citywide"}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-bold">{alert.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-slate-700">
                {alert.message}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                From {formatDateTime(alert.startsAt)}
              </p>
              <Link
                href={`/alerts/${alert.id}`}
                className="mt-4 inline-flex font-semibold text-emerald-700"
              >
                View alert →
              </Link>
            </article>
          ))}
        </div>
      )}
    </InfrastructureShell>
  );
}
