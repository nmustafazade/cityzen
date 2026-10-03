"use client";
import { useState } from "react";
import { getStoredToken } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { uploadServiceRequestDocuments } from "@/lib/service-requests";
import type { ServiceRequest } from "@/types/service-request";

export function ServiceRequestExtras({ request }: { request: ServiceRequest }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState(request.documents ?? []);
  const [error, setError] = useState("");
  async function download(id: number, name: string) {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    const response = await fetch(
      `${base}/api/service-requests/${request.id}/documents/${id}`,
      { headers: { Authorization: `Bearer ${getStoredToken() ?? ""}` } },
    );
    if (!response.ok) return;
    const url = URL.createObjectURL(await response.blob()),
      link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }
  async function upload() {
    setUploading(true);
    setError("");
    try {
      const result = await uploadServiceRequestDocuments(request.id, files);
      setDocuments((current) => [...current, ...(result.documents ?? [])]);
      setFiles([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }
  return (
    <>
      {request.appointmentSlot && (
        <section className="mt-6 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">Appointment</h2>
          <p className="mt-2">
            {formatDateTime(request.appointmentSlot.startsAt)} –{" "}
            {formatDateTime(request.appointmentSlot.endsAt)}
          </p>
        </section>
      )}
      {request.fieldValues && request.fieldValues.length > 0 && (
        <section className="mt-6 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">Service Details</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {request.fieldValues.map((field) => (
              <div key={field.id}>
                <dt className="text-xs font-bold uppercase text-slate-500">
                  {field.fieldLabelSnapshot}
                </dt>
                <dd className="mt-1">
                  {typeof field.value === "boolean"
                    ? field.value
                      ? "Yes"
                      : "No"
                    : String(field.value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {request.service.allowsDocuments && (
        <section className="mt-6 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">Supporting Documents</h2>
          {documents.length > 0 && (
            <ul className="mt-3 space-y-2">
              {documents.map((document) => (
                <li
                  key={document.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span>
                    {document.originalFileName}{" "}
                    <small className="text-slate-500">
                      ({Math.ceil(document.fileSize / 1024)} KB)
                    </small>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      void download(document.id, document.originalFileName)
                    }
                    className="font-semibold text-emerald-700"
                  >
                    Download
                  </button>
                </li>
              ))}
            </ul>
          )}
          {documents.length < request.service.maxDocuments && (
            <div className="mt-4 flex flex-wrap gap-3">
              <input
                type="file"
                multiple
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setFiles(
                    Array.from(event.target.files ?? []).slice(
                      0,
                      request.service.maxDocuments - documents.length,
                    ),
                  )
                }
              />
              <button
                type="button"
                disabled={!files.length || uploading}
                onClick={() => void upload()}
                className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </section>
      )}
    </>
  );
}
