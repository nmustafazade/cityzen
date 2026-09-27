"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CitizenRoute } from "@/components/auth/ProtectedRoute";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { ApiError } from "@/lib/api";
import { createServiceRequest } from "@/lib/service-requests";
import { getService } from "@/lib/services";
import type { Coordinates } from "@/types/location";
import type { MunicipalService } from "@/types/service";

const input = "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100";
export default function RequestServicePage() {
  const { id } = useParams<{ id: string }>(); const router = useRouter();
  const [service, setService] = useState<MunicipalService | null>(null); const [description, setDescription] = useState(""); const [address, setAddress] = useState(""); const [preferredDate, setPreferredDate] = useState(""); const [contactPhone, setContactPhone] = useState(""); const [coordinates, setCoordinates] = useState<Coordinates | null>(null); const [error, setError] = useState(""); const [submitting, setSubmitting] = useState(false);
  useEffect(() => { void getService(Number(id)).then((response) => setService(response.service)).catch(() => setError("This service is unavailable.")); }, [id]);
  async function submit(event: FormEvent) { event.preventDefault(); if (!description.trim() || submitting) return; setSubmitting(true); setError(""); try { const response = await createServiceRequest({ serviceId: Number(id), description: description.trim(), address: address.trim() || undefined, preferredDate: preferredDate ? new Date(preferredDate).toISOString() : undefined, contactPhone: contactPhone.trim() || undefined, latitude: coordinates?.latitude, longitude: coordinates?.longitude }); router.push(`/my-services/${response.request.id}?submitted=1`); } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to submit service request."); } finally { setSubmitting(false); } }
  return <CitizenRoute><main className="mx-auto w-full max-w-3xl px-6 py-12"><Link href={`/services/${id}`} className="font-semibold text-emerald-700">← Back to Service</Link><h1 className="mt-6 text-3xl font-bold">Request {service?.title ?? "Service"}</h1>{service && <p className="mt-3 text-slate-600">{service.department.name} · {service.description}</p>}{error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}<form onSubmit={submit} className="mt-8 space-y-6 rounded-2xl border bg-white p-6 shadow-sm"><Field label="Description" required><textarea rows={6} maxLength={2000} required value={description} onChange={(event) => setDescription(event.target.value)} className={input} placeholder="Describe what you need from this municipal service."/></Field><Field label="Address"><input maxLength={255} value={address} onChange={(event) => setAddress(event.target.value)} className={input}/></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Preferred Date"><input type="datetime-local" value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} className={input}/></Field><Field label="Contact Phone"><input maxLength={50} value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} className={input}/></Field></div><LocationPicker coordinates={coordinates} onChange={setCoordinates} disabled={submitting}/><p className="text-xs text-slate-500">Location is optional for service requests.</p><button disabled={submitting || !service?.isActive} className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{submitting ? "Submitting..." : "Submit Request"}</button></form></main></CitizenRoute>;
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-slate-800">{label}{required && " *"}<span className="mt-2 block">{children}</span></label>; }
