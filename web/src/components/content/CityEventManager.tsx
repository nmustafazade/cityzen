"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { MunicipalityRoute } from "@/components/auth/ProtectedRoute";
import { FormLocationPicker } from "@/components/maps/FormLocationPicker";
import { useAuth } from "@/context/AuthContext";
import { uploadContentImage } from "@/lib/content-images";
import { createEvent, getManagedEvents, updateEvent } from "@/lib/events";
import { formatDateTime } from "@/lib/format";
import { getManagementDepartments } from "@/lib/management";
import type { Department } from "@/types/department";
import type { CityEvent } from "@/types/event";
import { ContentImagePicker } from "./ContentImagePicker";
import { Label, ManagementShell, field, panel } from "./ManagementShell";

const empty = { title: "", description: "", locationName: "", address: "", latitude: "", longitude: "", startsAt: "", endsAt: "", externalUrl: "", departmentId: "", isPublished: false };
const local = (value: string | null) => value ? new Date(value).toISOString().slice(0, 16) : "";

export function CityEventManager() {
  const { user } = useAuth();
  const [items, setItems] = useState<CityEvent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editing, setEditing] = useState<CityEvent | null>(null);
  const [form, setForm] = useState(empty);
  const [photo, setPhoto] = useState<File | null>(null);
  const [pickerKey, setPickerKey] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(() => getManagedEvents({ limit: 20 }).then((response) => setItems(response.events)).catch(() => setError("Unable to load events.")), []);

  useEffect(() => { void load(); if (user?.role === "ADMIN") void getManagementDepartments().then((response) => setDepartments(response.departments)); }, [load, user?.role]);
  function reset() { setEditing(null); setForm(empty); setPhoto(null); setPickerKey((key) => key + 1); }
  function edit(item: CityEvent) {
    setEditing(item); setPhoto(null); setPickerKey((key) => key + 1);
    setForm({ title: item.title, description: item.description, locationName: item.locationName ?? "", address: item.address ?? "", latitude: item.latitude == null ? "" : String(item.latitude), longitude: item.longitude == null ? "" : String(item.longitude), startsAt: local(item.startsAt), endsAt: local(item.endsAt), externalUrl: item.externalUrl ?? "", departmentId: item.department ? String(item.department.id) : "", isPublished: item.isPublished });
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    const data = { title: form.title, description: form.description, locationName: form.locationName || null, address: form.address || null, latitude: form.latitude ? Number(form.latitude) : null, longitude: form.longitude ? Number(form.longitude) : null, startsAt: new Date(form.startsAt).toISOString(), endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null, externalUrl: form.externalUrl || null, isPublished: form.isPublished, departmentId: user?.role === "ADMIN" ? (form.departmentId ? Number(form.departmentId) : null) : undefined };
    try {
      const result = editing ? await updateEvent(editing.id, data) : await createEvent(data);
      if (photo) { try { await uploadContentImage("events", result.event.id, photo); } catch { setError("The event was saved, but its photo could not be uploaded."); } }
      reset(); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save event."); }
    finally { setSaving(false); }
  }

  return <MunicipalityRoute><ManagementShell title="City Events"><p className="mt-3 text-slate-600">Create and publish city activities.</p>{error && <p role="alert" className="mt-5 text-red-700">{error}</p>}<div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_.8fr]"><div className="space-y-4">{items.length ? items.map((item) => <article key={item.id} className={panel}><div className="flex justify-between gap-4"><div><p className="text-xs font-bold uppercase text-emerald-700">{item.department?.name ?? "Citywide"}</p><h2 className="mt-1 font-bold">{item.title}</h2><p className="mt-2 text-sm text-slate-600">{formatDateTime(item.startsAt)} · {item.isPublished ? "Published" : "Draft"}</p><p className="mt-1 text-xs text-slate-500">{item.locationName ?? item.address ?? "No location"}</p></div><div className="flex gap-3"><button onClick={() => edit(item)} className="font-semibold text-emerald-700">Edit</button><button onClick={() => void updateEvent(item.id, { isPublished: !item.isPublished }).then(load)} className="font-semibold">{item.isPublished ? "Unpublish" : "Publish"}</button></div></div></article>) : <p className={panel}>No events have been created.</p>}</div><form onSubmit={submit} className={`${panel} h-fit space-y-4`}><h2 className="text-lg font-bold">{editing ? "Edit Event" : "Create Event"}</h2>{user?.role === "ADMIN" && <Label text="Scope"><select value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })} className={field}><option value="">Citywide</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></Label>}{(["title", "locationName", "address", "externalUrl"] as const).map((key) => <Label key={key} text={key.replace(/([A-Z])/g, " $1")}><input required={key === "title"} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className={field}/></Label>)}<Label text="Description"><textarea required rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={field}/></Label><div className="grid grid-cols-2 gap-3"><Label text="Latitude"><input type="number" step="any" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} className={field}/></Label><Label text="Longitude"><input type="number" step="any" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} className={field}/></Label></div><FormLocationPicker latitude={form.latitude} longitude={form.longitude} disabled={saving} onChange={(latitude, longitude) => setForm((current) => ({ ...current, latitude, longitude }))}/><Label text="Starts"><input required type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} className={field}/></Label><Label text="Ends (optional)"><input type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} className={field}/></Label><ContentImagePicker disabled={saving} resetKey={pickerKey} onFileChange={setPhoto}/><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}/> Publish now</label><button disabled={saving} className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white">{saving ? "Saving..." : "Save Event"}</button>{editing && <button type="button" onClick={reset} className="w-full font-semibold">Cancel</button>}</form></div></ManagementShell></MunicipalityRoute>;
}
