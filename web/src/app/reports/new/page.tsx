"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { CitizenRoute } from "@/components/auth/ProtectedRoute";
import { FormError } from "@/components/auth/LoginForm";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { ReportImagePicker } from "@/components/reports/ReportImagePicker";
import { ReportLoading } from "@/components/reports/ReportStates";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { suggestReportCategory } from "@/lib/ai";
import { formatCoordinate } from "@/lib/location";
import { createReport, getReportCategories, uploadReportImages } from "@/lib/reports";
import { getSimilarReports } from "@/lib/community";
import { toggleReportUpvote } from "@/lib/reports";
import type { Coordinates } from "@/types/location";
import type { CreateReportData, ReportCategory } from "@/types/report";

const initialForm = {
  categoryId: "",
  title: "",
  description: "",
  addressText: "",
  latitude: "",
  longitude: "",
};

function CreateReportContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [form, setForm] = useState(initialForm);
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [createdReportId, setCreatedReportId] = useState<number | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isPublic,setIsPublic]=useState(false);
  const [similar,setSimilar]=useState<Array<{id:number;title:string;status:string;distanceMeters:number;supportCount:number;similarityScore:number}>>([]);
  const [checking,setChecking]=useState(false);
  const [categorySuggestion,setCategorySuggestion]=useState<{categoryId:number|null;categoryName:string|null;confidence:number;reason:string}|null>(null);
  const [suggestingCategory,setSuggestingCategory]=useState(false);

  const handleApiError = useCallback((caughtError: unknown, fallback: string) => {
    if (caughtError instanceof ApiError && caughtError.status === 401) {
      logout();
      router.replace("/login");
      return;
    }
    setError(caughtError instanceof ApiError ? caughtError.message : fallback);
  }, [logout, router]);

  const loadCategories = useCallback(async () => {
    await Promise.resolve();
    setIsLoadingCategories(true);
    setError("");
    try {
      const response = await getReportCategories();
      setCategories(response.categories);
    } catch (caughtError) {
      handleApiError(caughtError, "Unable to load report categories.");
    } finally {
      setIsLoadingCategories(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    let isCurrent = true;
    void getReportCategories()
      .then((response) => {
        if (isCurrent) setCategories(response.categories);
      })
      .catch((caughtError: unknown) => {
        if (isCurrent) handleApiError(caughtError, "Unable to load report categories.");
      })
      .finally(() => {
        if (isCurrent) setIsLoadingCategories(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [handleApiError]);

  function update(field: keyof typeof form) {
    return (value: string) => setForm((current) => ({ ...current, [field]: value }));
  }

  function updateLocation(coordinates: Coordinates | null) {
    setSelectedCoordinates(coordinates);
    setForm((current) => ({
      ...current,
      latitude: coordinates ? formatCoordinate(coordinates.latitude) : "",
      longitude: coordinates ? formatCoordinate(coordinates.longitude) : "",
    }));
  }

  function validate(): string | null {
    const title = form.title.trim();
    const description = form.description.trim();
    const address = form.addressText.trim();
    if (!form.categoryId) return "Select a report category.";
    if (!title) return "Title is required.";
    if (title.length > 150) return "Title must be 150 characters or fewer.";
    if (!description) return "Description is required.";
    if (description.length > 5000) return "Description must be 5,000 characters or fewer.";
    if (!address) return "Address is required.";
    if (address.length > 180) return "Address must be 180 characters or fewer.";
    if (!selectedCoordinates) return "Select the issue location on the map.";
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!selectedCoordinates) {
      setError("Select the issue location on the map.");
      return;
    }
    const submissionCoordinates = selectedCoordinates;

    setError("");
    setIsSubmitting(true);
    try {
      let reportId = createdReportId;
      if (!reportId) {
        const data: CreateReportData = {
          categoryId: Number(form.categoryId),
          title: form.title.trim(),
          description: form.description.trim(),
          addressText: form.addressText.trim(),
          latitude: submissionCoordinates.latitude,
          longitude: submissionCoordinates.longitude,
          isPublic,
        };
        const response = await createReport(data);
        reportId = response.report.id;
        setCreatedReportId(reportId);
      }

      if (images.length > 0) {
        try {
          await uploadReportImages(reportId, images);
        } catch (uploadError) {
          if (uploadError instanceof ApiError && uploadError.status === 401) {
            logout();
            router.replace("/login");
            return;
          }
          const reason = uploadError instanceof ApiError ? uploadError.message : "Please try uploading them again.";
          setError(`Your report was created, but the photos could not be uploaded. ${reason}`);
          return;
        }
      }
      router.push(`/reports/${reportId}`);
    } catch (caughtError) {
      handleApiError(caughtError, "Unable to submit your report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:py-14">
      <Link href="/reports" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">← Back to My Reports</Link>
      <div className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Citizen reports</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Report an Issue</h1>
        <p className="mt-3 text-slate-600">Tell us about a problem in your city.</p>
      </div>

      {isLoadingCategories ? (
        <div className="mt-8"><ReportLoading message="Loading report form..." /></div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {error && <FormError message={error} />}
          {createdReportId && error && (
            <p className="text-sm text-slate-700">
              Report #{createdReportId} already exists. Retrying will only upload the selected photos. You can also <Link href={`/reports/${createdReportId}`} className="font-semibold text-emerald-700 underline">open the report</Link>.
            </p>
          )}
          {error && categories.length === 0 && (
            <button type="button" onClick={() => void loadCategories()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
              Retry Categories
            </button>
          )}
          <div>
            <label htmlFor="categoryId" className="mb-1.5 block text-sm font-semibold text-slate-800">Category <span aria-hidden="true">*</span></label>
            <select id="categoryId" required value={form.categoryId} onChange={(event) => update("categoryId")(event.target.value)} className={inputStyle}>
              <option value="">Select a category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            {categories.length === 0 && <p className="mt-2 text-sm text-amber-700">No active report categories are currently available.</p>}
          </div>
          <FormField label="Title" id="title" required value={form.title} onChange={update("title")} maxLength={150} />
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-slate-800">Description <span aria-hidden="true">*</span></label>
            <textarea id="description" required rows={6} maxLength={5000} value={form.description} onChange={(event) => update("description")(event.target.value)} className={inputStyle} />
          </div>
          <div><button type="button" disabled={suggestingCategory||!form.title.trim()||!form.description.trim()} onClick={async()=>{setSuggestingCategory(true);try{setCategorySuggestion(await suggestReportCategory(form.title,form.description))}catch(caught){handleApiError(caught,"Unable to suggest a category.")}finally{setSuggestingCategory(false)}}} className="rounded-lg border border-emerald-600 px-4 py-2 font-semibold text-emerald-700 disabled:opacity-50">{suggestingCategory?"Analyzing...":"Suggest Category"}</button>{categorySuggestion&&<div className="mt-3 rounded-xl bg-emerald-50 p-4 text-sm"><strong>{categorySuggestion.categoryName??"No clear suggestion"}</strong> · {Math.round(categorySuggestion.confidence*100)}% confidence<p className="mt-1 text-slate-600">{categorySuggestion.reason}</p>{categorySuggestion.categoryId&&<button type="button" onClick={()=>update("categoryId")(String(categorySuggestion.categoryId))} className="mt-2 font-bold text-emerald-700 underline">Use suggestion</button>}<p className="mt-2 text-xs text-slate-500">Assistance only—you remain in control.</p></div>}</div>
          <FormField label="Address" id="addressText" required value={form.addressText} onChange={update("addressText")} maxLength={180} />
          <LocationPicker coordinates={selectedCoordinates} onChange={updateLocation} disabled={isSubmitting} required />
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"><input type="checkbox" checked={isPublic} onChange={(event)=>setIsPublic(event.target.checked)} className="mt-1"/><span><strong className="block">Share this issue publicly</strong><span className="text-sm text-slate-600">Public pages hide your identity, exact address, and precise coordinates.</span></span></label>
          {form.categoryId&&selectedCoordinates&&<button type="button" disabled={checking} onClick={async()=>{setChecking(true);try{setSimilar((await getSimilarReports({categoryId:Number(form.categoryId),latitude:selectedCoordinates.latitude,longitude:selectedCoordinates.longitude,title:form.title})).reports)}catch(caught){handleApiError(caught,"Unable to check similar issues.")}finally{setChecking(false)}}} className="rounded-lg border border-emerald-600 px-4 py-2 font-semibold text-emerald-700">{checking?"Checking...":"Check for Similar Issues"}</button>}
          {similar.length>0&&<section className="rounded-xl border border-amber-200 bg-amber-50 p-4"><h2 className="font-bold">Similar issues already reported nearby</h2><div className="mt-3 space-y-3">{similar.map(item=><article key={item.id} className="rounded-lg bg-white p-3"><p className="font-semibold">{item.title}</p><p className="text-sm text-slate-600">{item.distanceMeters} m away · {item.status.replaceAll("_"," ")} · {item.supportCount} supporters · {Math.round(item.similarityScore*100)}% match</p><div className="mt-2 flex gap-4"><Link href={`/community/reports/${item.id}`} className="text-sm font-semibold text-emerald-700">View Issue</Link><button type="button" onClick={async()=>{await toggleReportUpvote(item.id);router.push(`/community/reports/${item.id}`)}} className="text-sm font-semibold text-emerald-700">Support Existing Issue</button></div></article>)}</div><p className="mt-3 text-sm">You may still continue and submit a new report.</p></section>}
          <ReportImagePicker maxFiles={5} onFilesChange={setImages} disabled={isSubmitting} />
          <button type="submit" disabled={isSubmitting || categories.length === 0} className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-400">
            {isSubmitting ? "Submitting..." : createdReportId ? "Retry Photo Upload" : "Submit Report"}
          </button>
        </form>
      )}
    </main>
  );
}

const inputStyle = "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100";

function FormField({ label, id, value, onChange, required = false, type = "text", ...inputProps }: { label: string; id: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; maxLength?: number; step?: string; min?: string; max?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-800">{label} {required && <span aria-hidden="true">*</span>}</label>
      <input id={id} name={id} type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className={inputStyle} {...inputProps} />
    </div>
  );
}

export default function NewReportPage() {
  return <CitizenRoute><CreateReportContent /></CitizenRoute>;
}
