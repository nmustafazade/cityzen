"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { CitizenRoute } from "@/components/auth/ProtectedRoute";
import { FormError } from "@/components/auth/LoginForm";
import { ReportLoading } from "@/components/reports/ReportStates";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { createReport, getReportCategories } from "@/lib/reports";
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
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  function validate(): string | null {
    const title = form.title.trim();
    const description = form.description.trim();
    const address = form.addressText.trim();
    if (!form.categoryId) return "Select a report category.";
    if (!title) return "Title is required.";
    if (title.length > 150) return "Title must be 150 characters or fewer.";
    if (!description) return "Description is required.";
    if (description.length > 5000) return "Description must be 5,000 characters or fewer.";
    if (address.length > 180) return "Address must be 180 characters or fewer.";

    const hasLatitude = Boolean(form.latitude.trim());
    const hasLongitude = Boolean(form.longitude.trim());
    if (hasLatitude !== hasLongitude) return "Provide both latitude and longitude, or leave both empty.";
    if (hasLatitude) {
      const latitude = Number(form.latitude);
      const longitude = Number(form.longitude);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return "Latitude must be a number between -90 and 90.";
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return "Longitude must be a number between -180 and 180.";
    }
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

    const data: CreateReportData = {
      categoryId: Number(form.categoryId),
      title: form.title.trim(),
      description: form.description.trim(),
    };
    if (form.addressText.trim()) data.addressText = form.addressText.trim();
    if (form.latitude.trim() && form.longitude.trim()) {
      data.latitude = Number(form.latitude);
      data.longitude = Number(form.longitude);
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await createReport(data);
      router.push(`/reports/${response.report.id}`);
    } catch (caughtError) {
      handleApiError(caughtError, "Unable to submit your report. Please try again.");
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
          <FormField label="Address" id="addressText" value={form.addressText} onChange={update("addressText")} maxLength={180} />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Latitude" id="latitude" type="number" value={form.latitude} onChange={update("latitude")} step="any" min="-90" max="90" />
            <FormField label="Longitude" id="longitude" type="number" value={form.longitude} onChange={update("longitude")} step="any" min="-180" max="180" />
          </div>
          <button type="submit" disabled={isSubmitting || categories.length === 0} className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-400">
            {isSubmitting ? "Submitting..." : "Submit Report"}
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
