"use client";
import { useCallback, useEffect, useState } from "react";
import { MunicipalityRoute } from "@/components/auth/ProtectedRoute";
import {
  InfrastructureShell,
  StateMessage,
} from "@/components/infrastructure/InfrastructureShell";
import { getManagedWasteZones, saveWasteZone } from "@/lib/waste";
import type { WasteZone } from "@/types/waste";
function Content() {
  const [items, setItems] = useState<WasteZone[]>([]),
    [name, setName] = useState(""),
    [district, setDistrict] = useState(""),
    [departmentId, setDepartmentId] = useState(""),
    [error, setError] = useState("");
  const load = useCallback(
    () =>
      getManagedWasteZones()
        .then((r) => setItems(r.zones))
        .catch((e: Error) => setError(e.message)),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveWasteZone({
        name,
        district: district || undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
      });
      setName("");
      setDistrict("");
      load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Unable to save");
    }
  };
  return (
    <InfrastructureShell
      title="Waste Zones"
      subtitle="Manage named collection coverage areas for your department."
    >
      <form
        onSubmit={submit}
        className="mt-8 grid gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-3"
      >
        <Input label="Zone name" value={name} set={setName} />
        <Input
          label="District"
          value={district}
          set={setDistrict}
          required={false}
        />
        <Input
          label="Department ID (admin)"
          value={departmentId}
          set={setDepartmentId}
          required={false}
        />
        <button className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white sm:col-span-3">
          Create Zone
        </button>
      </form>
      {error && <StateMessage>{error}</StateMessage>}
      <div className="mt-8 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border bg-white p-4">
            <h2 className="font-bold">{item.name}</h2>
            <p className="text-sm text-slate-500">
              {item.district || "No district"} · {item.department.name}
            </p>
          </article>
        ))}
      </div>
    </InfrastructureShell>
  );
}
function Input({
  label,
  value,
  set,
  required = true,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        required={required}
        value={value}
        onChange={(e) => set(e.target.value)}
        className="mt-1 w-full rounded-lg border px-3 py-2"
      />
    </label>
  );
}
export default function Page() {
  return (
    <MunicipalityRoute>
      <Content />
    </MunicipalityRoute>
  );
}
