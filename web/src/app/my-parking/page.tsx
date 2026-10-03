"use client";
import { useCallback, useEffect, useState } from "react";
import { CitizenRoute } from "@/components/auth/ProtectedRoute";
import {
  InfrastructureShell,
  StateMessage,
} from "@/components/infrastructure/InfrastructureShell";
import {
  cancelParkingReservation,
  getMyParkingReservations,
} from "@/lib/infrastructure";
import { formatDateTime } from "@/lib/format";
import type { ParkingReservation } from "@/types/infrastructure";
import { reservationStatusLabels } from "@/types/infrastructure";

function Content() {
  const [items, setItems] = useState<ParkingReservation[]>([]),
    [status, setStatus] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(
    () =>
      getMyParkingReservations(status)
        .then((result) => {
          setItems(result.reservations);
          setError("");
        })
        .catch((reason: Error) => setError(reason.message))
        .finally(() => setLoading(false)),
    [status],
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);
  const cancel = async (id: number) => {
    if (!window.confirm("Cancel this reservation?")) return;
    try {
      await cancelParkingReservation(id);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to cancel");
    }
  };
  return (
    <InfrastructureShell
      title="My Parking"
      subtitle="Review and manage your parking reservations."
    >
      <label className="mt-7 block max-w-xs text-sm font-semibold">
        Status
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        >
          <option value="">All</option>
          {Object.entries(reservationStatusLabels).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      </label>
      {loading ? (
        <StateMessage>Loading reservations...</StateMessage>
      ) : error ? (
        <StateMessage>{error}</StateMessage>
      ) : !items.length ? (
        <StateMessage>No parking reservations yet.</StateMessage>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border bg-white p-5">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h2 className="font-bold">{item.parkingFacility.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDateTime(item.startsAt)} –{" "}
                    {formatDateTime(item.endsAt)}
                  </p>
                </div>
                <span className="font-semibold text-emerald-700">
                  {reservationStatusLabels[item.status]}
                </span>
              </div>
              {item.status === "RESERVED" && (
                <button
                  onClick={() => cancel(item.id)}
                  className="mt-4 text-sm font-semibold text-rose-700"
                >
                  Cancel reservation
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </InfrastructureShell>
  );
}
export default function MyParkingPage() {
  return (
    <CitizenRoute>
      <Content />
    </CitizenRoute>
  );
}
