"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CitizenRoute } from "@/components/auth/ProtectedRoute";
import {
  ServiceRequestStatusBadge,
  serviceRequestStatusLabel,
} from "@/components/service-requests/ServiceRequestStatusBadge";
import { formatDateTime } from "@/lib/format";
import {
  getMyServiceRequests,
  serviceRequestReference,
} from "@/lib/service-requests";
import type {
  ServiceRequest,
  ServiceRequestStatus,
} from "@/types/service-request";

const statuses: ServiceRequestStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];
export default function MyServicesPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [status, setStatus] = useState<ServiceRequestStatus | "">("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getMyServiceRequests({ status, page, limit: 10 });
      setRequests(response.requests);
      setPages(Math.max(1, response.pagination.totalPages));
    } catch {
      setError("Unable to load service requests.");
    } finally {
      setLoading(false);
    }
  }, [page, status]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  return (
    <CitizenRoute>
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Service Requests</h1>
            <p className="mt-2 text-slate-600">
              Track municipal services you have requested.
            </p>
          </div>
          <Link
            href="/services"
            className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white"
          >
            Browse City Services
          </Link>
        </div>
        <label className="mt-8 block max-w-xs text-sm font-semibold">
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ServiceRequestStatus | "");
              setPage(1);
            }}
            className="mt-2 w-full rounded-lg border px-3 py-2"
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {serviceRequestStatusLabel(item)}
              </option>
            ))}
          </select>
        </label>
        {loading ? (
          <p className="mt-8">Loading requests...</p>
        ) : error ? (
          <div className="mt-8">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => void load()}
              className="mt-3 font-semibold text-emerald-700"
            >
              Retry
            </button>
          </div>
        ) : requests.length === 0 ? (
          <section className="mt-8 rounded-2xl border bg-white p-8 text-center">
            <h2 className="text-xl font-bold">No service requests yet</h2>
            <p className="mt-2 text-slate-600">
              Browse city services to submit your first request.
            </p>
          </section>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {requests.map((request) => (
              <article
                key={request.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex justify-between gap-3">
                  <p className="font-mono text-sm font-bold text-emerald-700">
                    {serviceRequestReference(request.id)}
                  </p>
                  <ServiceRequestStatusBadge status={request.status} />
                </div>
                <h2 className="mt-4 text-xl font-bold">
                  {request.service.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {request.department.name}
                </p>
                <dl className="mt-4 text-sm text-slate-500">
                  <div>Submitted {formatDateTime(request.submittedAt)}</div>
                  {request.preferredDate && (
                    <div className="mt-1">
                      Preferred {formatDateTime(request.preferredDate)}
                    </div>
                  )}
                  {request.assignedEmployee && (
                    <div className="mt-1">
                      Assigned to {request.assignedEmployee.firstName}{" "}
                      {request.assignedEmployee.lastName}
                    </div>
                  )}
                </dl>
                <Link
                  href={`/my-services/${request.id}`}
                  className="mt-5 inline-flex font-semibold text-emerald-700"
                >
                  View Details →
                </Link>
              </article>
            ))}
          </div>
        )}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-lg border px-4 py-2 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-lg border px-4 py-2 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </main>
    </CitizenRoute>
  );
}
