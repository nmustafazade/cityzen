"use client";

import { useCallback, useEffect, useState } from "react";

import { MunicipalityRoute } from "@/components/auth/ProtectedRoute";
import { InfrastructureShell, StateMessage } from "@/components/infrastructure/InfrastructureShell";
import { FormLocationPicker } from "@/components/maps/FormLocationPicker";
import { getManagedEnvironmentalStations, saveEnvironmentalStation } from "@/lib/environment";
import type { EnvironmentalStation } from "@/types/environment";

function Content() {
  const [items, setItems] = useState<EnvironmentalStation[]>([]);
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    () => getManagedEnvironmentalStations().then((response) => setItems(response.stations)).catch((caught: Error) => setError(caught.message)),
    [],
  );

  useEffect(() => { void load(); }, [load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveEnvironmentalStation({
        name,
        latitude: Number(latitude),
        longitude: Number(longitude),
        departmentId: departmentId ? Number(departmentId) : undefined,
      });
      setName("");
      setLatitude("");
      setLongitude("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <InfrastructureShell title="Environmental Stations" subtitle="Manage municipality-owned monitoring stations. External stations remain read-only.">
      <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-4">
        <Input label="Name" value={name} set={setName} />
        <Input label="Latitude" value={latitude} set={setLatitude} type="number" />
        <Input label="Longitude" value={longitude} set={setLongitude} type="number" />
        <Input label="Department ID (admin)" value={departmentId} set={setDepartmentId} required={false} />
        <div className="sm:col-span-4">
          <FormLocationPicker
            latitude={latitude}
            longitude={longitude}
            required
            disabled={saving}
            onChange={(nextLatitude, nextLongitude) => {
              setLatitude(nextLatitude);
              setLongitude(nextLongitude);
            }}
          />
        </div>
        <button disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-60 sm:col-span-4">
          {saving ? "Creating..." : "Create Station"}
        </button>
      </form>
      {error && <StateMessage>{error}</StateMessage>}
      <div className="mt-8 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border bg-white p-4">
            <h2 className="font-bold">{item.name}</h2>
            <p className="text-sm text-slate-500">{item.department?.name || "Citywide"} · {item.source}</p>
          </article>
        ))}
      </div>
    </InfrastructureShell>
  );
}

function Input({ label, value, set, type = "text", required = true }: { label: string; value: string; set: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="text-sm font-semibold">{label}<input type={type} step={type === "number" ? "any" : undefined} required={required} value={value} onChange={(event) => set(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>;
}

export default function Page() {
  return <MunicipalityRoute><Content /></MunicipalityRoute>;
}
