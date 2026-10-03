"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAlerts } from "@/lib/emergency";
import type { EmergencyAlert } from "@/types/emergency";
export function EmergencyBanner() {
  const [alert, setAlert] = useState<EmergencyAlert | null>(null),
    [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    getAlerts("CRITICAL")
      .then((r) => setAlert(r.alerts[0] || null))
      .catch(() => undefined);
  }, []);
  if (!alert || dismissed) return null;
  return (
    <div role="alert" className="bg-rose-700 px-6 py-3 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href={`/alerts/${alert.id}`} className="text-sm font-semibold">
          <span className="mr-2 uppercase">Critical alert:</span>
          {alert.title} →
        </Link>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss critical alert banner"
          className="rounded px-2 py-1 font-bold hover:bg-rose-800"
        >
          ×
        </button>
      </div>
    </div>
  );
}
