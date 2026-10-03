"use client";
import { useQueryState } from "@/hooks/useQueryState";
import { Pager } from "@/components/content/PublicListShell";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  InfrastructureShell,
  StateMessage,
} from "@/components/infrastructure/InfrastructureShell";
import { getNearbyParking, getParkingFacilities } from "@/lib/infrastructure";
import type { ParkingFacility } from "@/types/infrastructure";
import { parkingTypeLabels, sourceLabels } from "@/types/infrastructure";

function Availability({ item }: { item: ParkingFacility }) {
  return item.availableSpaces === null ? (
    <div className="mt-5 rounded-xl bg-slate-100 p-4">
      <p className="font-extrabold text-slate-700">Availability not provided</p>
      <p className="mt-1 text-xs text-slate-500">
        Live occupancy data is unavailable
      </p>
    </div>
  ) : (
    <div className="mt-5 rounded-xl bg-teal-50 p-4">
      <div className="flex items-end justify-between">
        <p className="text-3xl font-extrabold text-teal-800">
          {item.availableSpaces}
          <span className="text-sm font-semibold text-slate-500"> spaces</span>
        </p>
        <span className="text-xs font-bold text-teal-700">
          {item.totalSpaces
            ? Math.round((item.availableSpaces / item.totalSpaces) * 100)
            : 0}
          % open
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-teal-100">
        <div
          className="h-full rounded-full bg-teal-500"
          style={{
            width: `${item.totalSpaces ? Math.min(100, (item.availableSpaces / item.totalSpaces) * 100) : 0}%`,
          }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        of {item.totalSpaces} total spaces
      </p>
    </div>
  );
}
export default function ParkingPage() {
  const [items, setItems] = useState<ParkingFacility[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [type, setType] = useQueryState<string>("type", ""),
    [available, setAvailable] = useQueryState<boolean>(
      "hasAvailableSpaces",
      false,
    ),
    [reservable, setReservable] = useQueryState<boolean>(
      "supportsReservation",
      false,
    ),
    [ev, setEv] = useQueryState<boolean>("hasEVCharging", false),
    [accessible, setAccessible] = useQueryState<boolean>(
      "hasAccessibleParking",
      false,
    ),
    [locating, setLocating] = useState(false);
  const [page, setPage] = useQueryState<number>("page", 1);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [nearbyMode, setNearbyMode] = useState(false);
  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setNearbyMode(false);
      getParkingFacilities({
        page,
        limit: 12,
        type,
        hasAvailableSpaces: available || undefined,
        supportsReservation: reservable || undefined,
        hasEVCharging: ev || undefined,
        hasAccessibleParking: accessible || undefined,
      })
        .then((result) => {
          if (!current) return;
          setItems(result.parking);
          setMeta(result.pagination);
          setError("");
        })
        .catch((reason: Error) => {
          if (current) setError(reason.message);
        })
        .finally(() => {
          if (current) setLoading(false);
        });
    }, 0);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [type, available, reservable, ev, accessible, page]);
  const nearby = () => {
    if (!navigator.geolocation)
      return setError("Location is not supported by this browser.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        getNearbyParking(position.coords.latitude, position.coords.longitude)
          .then((result) => {
            setItems(result.parking);
            setNearbyMode(true);
            setError("");
          })
          .catch((reason: Error) => setError(reason.message))
          .finally(() => setLocating(false));
      },
      () => {
        setError(
          "Your location could not be determined. You can still browse all parking.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };
  return (
    <InfrastructureShell
      title="Parking"
      subtitle="Find municipality and OpenStreetMap parking information."
    >
      <div className="mt-7 flex flex-wrap items-end gap-4">
        <label className="text-sm font-semibold">
          Facility type
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="mt-1 block rounded-lg border px-3 py-2"
          >
            <option value="">All</option>
            {Object.entries(parkingTypeLabels).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </label>
        {[
          [available, setAvailable, "Available"],
          [reservable, setReservable, "Reservations"],
          [ev, setEv, "EV charging"],
          [accessible, setAccessible, "Accessible"],
        ].map(([value, set, label]) => (
          <label
            key={String(label)}
            className="flex items-center gap-2 pb-2 text-sm"
          >
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(event) =>
                (set as (next: boolean) => void)(event.target.checked)
              }
            />
            {String(label)}
          </label>
        ))}
        <button
          onClick={nearby}
          disabled={locating}
          className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700"
        >
          {locating ? "Finding..." : "Nearby Parking"}
        </button>
      </div>
      {loading ? (
        <StateMessage>Loading parking...</StateMessage>
      ) : error ? (
        <StateMessage>{error}</StateMessage>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              <div className="flex justify-between gap-3">
                <p className="text-xs font-bold uppercase text-blue-700">
                  {parkingTypeLabels[item.type]}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Source: {sourceLabels[item.source]}
                </p>
              </div>
              <h2 className="mt-2 text-lg font-bold">{item.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.address}</p>
              <Availability item={item} />
              <div className="mt-3 text-sm text-slate-600">
                {item.evChargingSpaces} EV · {item.accessibleSpaces} accessible
              </div>
              <Link
                href={`/parking/${item.id}`}
                className="mt-5 inline-flex font-semibold text-emerald-700"
              >
                View parking →
              </Link>
            </article>
          ))}
        </div>
      )}
      {!loading && !error && !nearbyMode && (
        <Pager meta={meta} onPage={setPage} />
      )}
      <p className="mt-8 text-xs text-slate-500">
        OpenStreetMap data may be incomplete. © OpenStreetMap contributors.
      </p>
    </InfrastructureShell>
  );
}
