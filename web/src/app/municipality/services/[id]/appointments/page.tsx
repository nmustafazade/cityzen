"use client";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MunicipalityRoute } from "@/components/auth/ProtectedRoute";
import {
  createAppointmentSlot,
  getManagedAppointmentSlots,
  type AppointmentSlot,
} from "@/lib/services";
import { formatDateTime } from "@/lib/format";
export default function Page() {
  const { id } = useParams<{ id: string }>(),
    serviceId = Number(id);
  const [slots, setSlots] = useState<
      Array<AppointmentSlot & { bookings: number }>
    >([]),
    [startsAt, setStartsAt] = useState(""),
    [endsAt, setEndsAt] = useState(""),
    [capacity, setCapacity] = useState(1),
    [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const load = useCallback(
    () =>
      getManagedAppointmentSlots(serviceId)
        .then((r) => setSlots(r.slots))
        .catch((e: Error) => setError(e.message)),
    [serviceId],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError("");
    setSuccess("");
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      end <= start
    ) {
      setError("Choose valid dates. The end must be after the start.");
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      setError("Capacity must be a whole number of at least 1.");
      return;
    }
    setSaving(true);
    try {
      await createAppointmentSlot(serviceId, {
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        capacity,
      });
      setStartsAt("");
      setEndsAt("");
      setSuccess(
        "Appointment slot created. Enable appointments in Service Configuration so citizens can book it.",
      );
      await load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Unable to create slot");
    } finally {
      setSaving(false);
    }
  }
  return (
    <MunicipalityRoute>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link
          href={`/municipality/services/${serviceId}/configuration`}
          className="font-semibold text-emerald-700"
        >
          ← Service Configuration
        </Link>
        <h1 className="mt-5 text-3xl font-bold">Appointment Slots</h1>
        {error && (
          <p role="alert" className="mt-4 text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="mt-4 text-emerald-700">
            {success}
          </p>
        )}
        <form
          onSubmit={submit}
          className="mt-6 grid gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-3"
        >
          <Input label="Starts" value={startsAt} set={setStartsAt} />
          <Input label="Ends" value={endsAt} set={setEndsAt} />
          <label className="text-sm font-semibold">
            Capacity
            <input
              type="number"
              min="1"
              required
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-60 sm:col-span-3"
          >
            {saving ? "Creating..." : "Create Slot"}
          </button>
        </form>
        <div className="mt-7 space-y-3">
          {slots.map((slot) => (
            <article key={slot.id} className="rounded-xl border bg-white p-4">
              <strong>
                {formatDateTime(slot.startsAt)} – {formatDateTime(slot.endsAt)}
              </strong>
              <p className="text-sm text-slate-600">
                {slot.bookings} booked · {slot.remainingCapacity} remaining ·
                Capacity {slot.capacity}
              </p>
            </article>
          ))}
        </div>
      </main>
    </MunicipalityRoute>
  );
}
function Input({
  label,
  value,
  set,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        type="datetime-local"
        required
        value={value}
        onChange={(e) => set(e.target.value)}
        className="mt-1 w-full rounded-lg border px-3 py-2"
      />
    </label>
  );
}
