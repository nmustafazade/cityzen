"use client";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CitizenRoute } from "@/components/auth/ProtectedRoute";
import {
  InfrastructureShell,
  StateMessage,
} from "@/components/infrastructure/InfrastructureShell";
import {
  createParkingReservation,
  getParkingFacility,
} from "@/lib/infrastructure";
import type { ParkingFacility } from "@/types/infrastructure";
function Content({ id }: { id: number }) {
  const router = useRouter(),
    [item, setItem] = useState<ParkingFacility | null>(null),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    getParkingFacility(id)
      .then((r) => setItem(r.parking))
      .catch((e: Error) => setError(e.message));
  }, [id]);
  const estimate = useMemo(() => {
    if (!item?.hourlyPrice || !start || !end) return null;
    const hours =
      (new Date(end).getTime() - new Date(start).getTime()) / 3600000;
    return hours > 0 ? (hours * Number(item.hourlyPrice)).toFixed(2) : null;
  }, [item, start, end]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await createParkingReservation(
        id,
        new Date(start).toISOString(),
        new Date(end).toISOString(),
      );
      router.push(`/my-parking?created=${r.reservation.id}`);
    } catch (x) {
      setError(x instanceof Error ? x.message : "Unable to reserve parking");
    } finally {
      setBusy(false);
    }
  };
  if (!item)
    return (
      <InfrastructureShell title="Reserve Parking" subtitle="">
        <StateMessage>{error || "Loading..."}</StateMessage>
      </InfrastructureShell>
    );
  return (
    <InfrastructureShell
      title={`Reserve ${item.name}`}
      subtitle="Choose a parking time window. No payment is collected online."
    >
      <form
        onSubmit={submit}
        className="mt-8 max-w-xl rounded-2xl border bg-white p-6 shadow-sm"
      >
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
          >
            {error}
          </p>
        )}
        <label className="block text-sm font-semibold">
          Start
          <input
            type="datetime-local"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold">
          End
          <input
            type="datetime-local"
            required
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        {estimate && (
          <p className="mt-4 text-sm text-slate-600">
            Estimated price:{" "}
            <strong>
              {estimate} {item.currency || ""}
            </strong>
            . Payment is not processed by Cityzen.
          </p>
        )}
        <button
          disabled={busy}
          className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Reserving..." : "Reserve Parking"}
        </button>
      </form>
    </InfrastructureShell>
  );
}
export default function ReservePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <CitizenRoute>
      <Content id={Number(id)} />
    </CitizenRoute>
  );
}
