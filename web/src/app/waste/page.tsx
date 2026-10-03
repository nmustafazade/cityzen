"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  InfrastructureShell,
  StateMessage,
} from "@/components/infrastructure/InfrastructureShell";
import {
  InfrastructureMap,
  type InfrastructureMarker,
} from "@/components/maps/InfrastructureMap";
import { useAuth } from "@/context/AuthContext";
import {
  getMyWasteSchedule,
  getNextCollections,
  getWasteFacilities,
  getWasteReminders,
  saveWasteReminder,
} from "@/lib/waste";
import { formatDateTime } from "@/lib/format";
import type {
  WasteFacility,
  WasteSchedule,
  WasteType,
  WasteZone,
} from "@/types/waste";
import { wasteFacilityLabels, wasteLabels } from "@/types/waste";
export default function WastePage() {
  const { user } = useAuth(),
    [facilities, setFacilities] = useState<WasteFacility[]>([]),
    [addresses, setAddresses] = useState<
      Array<{
        id: number;
        label: string | null;
        city: string;
        district: string | null;
        wasteCollectionZoneId: number | null;
      }>
    >([]),
    [addressId, setAddressId] = useState<number>(),
    [zone, setZone] = useState<WasteZone | null>(null),
    [schedules, setSchedules] = useState<WasteSchedule[]>([]),
    [next, setNext] = useState<
      Array<{
        wasteType: WasteType;
        date: string;
        collectionTime: string | null;
      }>
    >([]),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    getWasteFacilities({ limit: 100 })
      .then((r) => setFacilities(r.facilities))
      .catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => {
    if (user?.role !== "CITIZEN") return;
    getMyWasteSchedule(addressId)
      .then(async (r) => {
        setAddresses(r.addresses);
        setZone(r.zone);
        setSchedules(r.schedules);
        setMessage(r.message || "");
        if (r.zone) setNext((await getNextCollections(r.zone.id)).collections);
      })
      .catch((e: Error) => setError(e.message));
  }, [user, addressId]);
  const enable = async (wasteType: WasteType) => {
    if (!addressId && addresses[0]) setAddressId(addresses[0].id);
    const id = addressId || addresses[0]?.id;
    if (!id) return setError("Add an address before enabling reminders.");
    try {
      await saveWasteReminder({
        addressId: id,
        wasteType,
        enabled: true,
        reminderHoursBefore: 12,
      });
      await getWasteReminders();
      setMessage(`Reminder enabled for ${wasteLabels[wasteType]}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save reminder");
    }
  };
  const markers: InfrastructureMarker[] = facilities.map((item) => ({
    id: `w${item.id}`,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    title: item.name || wasteFacilityLabels[item.type],
    detail: `${wasteFacilityLabels[item.type]} · ${item.acceptedTypes.map((x) => wasteLabels[x.wasteType]).join(", ") || "Accepted materials not listed"}`,
    href: "/waste",
    kind: "facility",
  }));
  return (
    <InfrastructureShell
      title="Waste & Recycling"
      subtitle="Collection schedules, recycling locations and waste services."
    >
      {error && <StateMessage>{error}</StateMessage>}
      {user?.role === "CITIZEN" && (
        <section className="mt-8 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">My Collection Schedule</h2>
          {addresses.length > 0 && (
            <label className="mt-4 block max-w-sm text-sm font-semibold">
              Address
              <select
                value={addressId || addresses[0]?.id || ""}
                onChange={(e) => setAddressId(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label || [a.district, a.city].filter(Boolean).join(", ")}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!zone ? (
            <p className="mt-4 text-sm text-slate-600">
              {message || "Collection schedule unavailable for this address."}
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm text-slate-600">
                Zone: <strong>{zone.name}</strong>
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {schedules.map((row) => (
                  <article key={row.id} className="rounded-xl bg-slate-50 p-4">
                    <p className="font-bold capitalize">
                      {row.dayOfWeek.toLowerCase()}
                    </p>
                    <p className="text-sm text-slate-700">
                      {wasteLabels[row.wasteType]}
                      {row.collectionTime ? ` · ${row.collectionTime}` : ""}
                    </p>
                    <button
                      onClick={() => enable(row.wasteType)}
                      className="mt-2 text-xs font-semibold text-emerald-700"
                    >
                      Notify me 12 hours before
                    </button>
                  </article>
                ))}
              </div>
              <h3 className="mt-6 font-bold">Next Collection</h3>
              <div className="mt-3 space-y-2">
                {next.slice(0, 5).map((item, index) => (
                  <p key={`${item.wasteType}-${index}`} className="text-sm">
                    <strong>{wasteLabels[item.wasteType]}</strong> ·{" "}
                    {formatDateTime(item.date)}
                    {item.collectionTime ? ` at ${item.collectionTime}` : ""}
                  </p>
                ))}
              </div>
            </>
          )}
        </section>
      )}
      <section className="mt-8">
        <h2 className="text-xl font-bold">Recycling & Waste Locations</h2>
        <div className="mt-4">
          <InfrastructureMap markers={markers} />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Imported recycling data may be incomplete. © OpenStreetMap
          contributors.
        </p>
      </section>
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/reports/new"
          className="rounded-2xl border bg-white p-5 font-bold"
        >
          Report a Waste Problem →
        </Link>
        <Link
          href="/services"
          className="rounded-2xl border bg-white p-5 font-bold"
        >
          Request Bulky Waste Pickup →
        </Link>
        <Link
          href="/city-map"
          className="rounded-2xl border bg-white p-5 font-bold"
        >
          Open City Map →
        </Link>
      </section>
    </InfrastructureShell>
  );
}
