"use client";
import { useEffect, useState } from "react";
import { AdminRoute } from "@/components/auth/ProtectedRoute";
import {
  InfrastructureShell,
  StateMessage,
} from "@/components/infrastructure/InfrastructureShell";
import {
  getFacilityCategories,
  saveFacilityCategory,
} from "@/lib/infrastructure";
import type { FacilityCategory } from "@/types/infrastructure";
function Content() {
  const [items, setItems] = useState<FacilityCategory[]>([]),
    [name, setName] = useState(""),
    [icon, setIcon] = useState(""),
    [description, setDescription] = useState(""),
    [editing, setEditing] = useState<number>(),
    [error, setError] = useState("");
  const load = () =>
    getFacilityCategories(true)
      .then((r) => setItems(r.categories))
      .catch((e: Error) => setError(e.message));
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveFacilityCategory(
        {
          name,
          icon: icon || undefined,
          description: description || undefined,
        },
        editing,
      );
      setName("");
      setIcon("");
      setDescription("");
      setEditing(undefined);
      load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Unable to save");
    }
  };
  const edit = (x: FacilityCategory) => {
    setEditing(x.id);
    setName(x.name);
    setIcon(x.icon || "");
    setDescription(x.description || "");
  };
  const toggle = async (x: FacilityCategory) => {
    try {
      await saveFacilityCategory({ isActive: !x.isActive }, x.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update");
    }
  };
  return (
    <InfrastructureShell
      title="Facility Categories"
      subtitle="Manage the database-driven categories used by city facilities."
    >
      <form
        onSubmit={submit}
        className="mt-8 grid gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-3"
      >
        <label className="text-sm font-semibold">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="text-sm font-semibold">
          Icon or emoji
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="text-sm font-semibold">
          Description
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <button className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white sm:col-span-3">
          {editing ? "Update" : "Create"} Category
        </button>
      </form>
      {error && <StateMessage>{error}</StateMessage>}
      <div className="mt-8 space-y-3">
        {items.map((x) => (
          <article
            key={x.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4"
          >
            <div>
              <h2 className="font-bold">
                {x.icon} {x.name}
              </h2>
              <p className="text-sm text-slate-500">
                {x.isActive ? "Active" : "Inactive"}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => edit(x)}
                className="font-semibold text-emerald-700"
              >
                Edit
              </button>
              <button
                onClick={() => toggle(x)}
                className="font-semibold text-slate-700"
              >
                {x.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </InfrastructureShell>
  );
}
export default function Page() {
  return (
    <AdminRoute>
      <Content />
    </AdminRoute>
  );
}
