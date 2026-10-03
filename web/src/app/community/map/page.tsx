"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CommunityReportMap } from "@/components/maps/CommunityReportMap";
import { getPublicReports } from "@/lib/community";
import type { PublicReport } from "@/types/community";
export default function Page() {
  const [reports, setReports] = useState<PublicReport[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    void getPublicReports({ limit: 100 })
      .then((r) => setReports(r.reports))
      .catch((e: Error) => setError(e.message));
  }, []);
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link href="/community" className="font-semibold text-emerald-700">
        ← City Issues
      </Link>
      <h1 className="mt-5 text-4xl font-bold">Public Issue Map</h1>
      <p className="mt-2 text-slate-600">
        Markers use approximate coordinates to protect residents’ precise
        locations.
      </p>
      {error ? (
        <p role="alert" className="mt-6 text-red-700">
          {error}
        </p>
      ) : (
        <div className="mt-8">
          <CommunityReportMap reports={reports} />
        </div>
      )}
    </main>
  );
}
