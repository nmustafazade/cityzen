"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { MunicipalityRoute } from "@/components/auth/ProtectedRoute";
import { getManagedWasteFacilities, saveWasteFacility } from "@/lib/waste";
import type { WasteFacility, WasteFacilityType, WasteType } from "@/types/waste";
import { wasteFacilityLabels, wasteLabels } from "@/types/waste";

const facilityTypes = Object.keys(wasteFacilityLabels) as WasteFacilityType[];
const wasteTypes = Object.keys(wasteLabels) as WasteType[];
const initial = { name: "", type: "RECYCLING_CENTER" as WasteFacilityType, address: "", latitude: "", longitude: "", openingHours: "", acceptedTypes: [] as WasteType[] };

export default function WasteFacilitiesPage() {
  const [facilities, setFacilities] = useState<WasteFacility[]>([]);
  const [form, setForm] = useState(initial);
  const [editingId, setEditingId] = useState<number>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const load = useCallback(() => getManagedWasteFacilities().then((result) => { setFacilities(result.facilities); setLoading(false); }).catch((e: Error) => { setError(e.message || "Could not load waste facilities."); setLoading(false); }), []);
  useEffect(() => { void load(); }, [load]);
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setError(""); try { await saveWasteFacility({ ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) }, editingId); setForm(initial); setEditingId(undefined); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Could not save the facility."); } finally { setSaving(false); } }
  function edit(item: WasteFacility) { setEditingId(item.id); setForm({ name: item.name ?? "", type: item.type, address: item.address ?? "", latitude: String(item.latitude), longitude: String(item.longitude), openingHours: item.openingHours ?? "", acceptedTypes: item.acceptedTypes.map((entry) => entry.wasteType) }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function toggle(value: WasteType) { setForm((current) => ({ ...current, acceptedTypes: current.acceptedTypes.includes(value) ? current.acceptedTypes.filter((item) => item !== value) : [...current.acceptedTypes, value] })); }
  return <MunicipalityRoute><main className="mx-auto w-full max-w-6xl px-6 py-10">
    <h1 className="text-3xl font-bold">Waste Facilities</h1><p className="mt-2 text-slate-600">Manage municipality facilities. OpenStreetMap imports remain read-only.</p>
    <form onSubmit={submit} className="mt-7 grid gap-4 rounded-2xl border bg-white p-6 shadow-sm sm:grid-cols-2">
      <label className="text-sm font-semibold">Name<input required value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-semibold">Facility type<select value={form.type} onChange={(e)=>setForm({...form,type:e.target.value as WasteFacilityType})} className="mt-1 w-full rounded-lg border px-3 py-2">{facilityTypes.map((type)=><option key={type} value={type}>{wasteFacilityLabels[type]}</option>)}</select></label>
      <label className="text-sm font-semibold sm:col-span-2">Address<input value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-semibold">Latitude<input required type="number" step="any" min="-90" max="90" value={form.latitude} onChange={(e)=>setForm({...form,latitude:e.target.value})} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-semibold">Longitude<input required type="number" step="any" min="-180" max="180" value={form.longitude} onChange={(e)=>setForm({...form,longitude:e.target.value})} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-semibold sm:col-span-2">Opening hours<input value={form.openingHours} onChange={(e)=>setForm({...form,openingHours:e.target.value})} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
      <fieldset className="sm:col-span-2"><legend className="text-sm font-semibold">Accepted waste</legend><div className="mt-2 flex flex-wrap gap-3">{wasteTypes.map((type)=><label key={type} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.acceptedTypes.includes(type)} onChange={()=>toggle(type)} />{wasteLabels[type]}</label>)}</div></fieldset>
      {error&&<p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
      <div className="flex gap-3 sm:col-span-2"><button disabled={saving} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving?"Saving...":editingId?"Update Facility":"Create Facility"}</button>{editingId&&<button type="button" onClick={()=>{setEditingId(undefined);setForm(initial)}} className="rounded-lg border px-4 py-2">Cancel edit</button>}</div>
    </form>
    <section className="mt-8 grid gap-4 sm:grid-cols-2">{loading?<p>Loading facilities...</p>:facilities.length===0?<p className="text-slate-600">No municipality facilities yet.</p>:facilities.map((item)=><article key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="font-bold">{item.name||wasteFacilityLabels[item.type]}</h2><p className="mt-1 text-sm text-slate-600">{wasteFacilityLabels[item.type]} · {item.address||"No address"}</p><p className="mt-2 text-xs text-slate-500">{item.acceptedTypes.length?item.acceptedTypes.map((entry)=>wasteLabels[entry.wasteType]).join(", "):"Accepted types not specified"}</p><button type="button" onClick={()=>edit(item)} className="mt-4 rounded-lg border px-3 py-2 text-sm font-semibold">Edit</button></article>)}</section>
  </main></MunicipalityRoute>;
}
