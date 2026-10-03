"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CitizenRoute } from "@/components/auth/ProtectedRoute";
import { ReportLocationMap } from "@/components/maps/ReportLocationMap";
import { ServiceRequestStatusBadge } from "@/components/service-requests/ServiceRequestStatusBadge";
import { ServiceRequestTimeline } from "@/components/service-requests/ServiceRequestTimeline";
import { ServiceRequestExtras } from "@/components/service-requests/ServiceRequestExtras";
import { formatDateTime } from "@/lib/format";
import { coordinatesFromValues, formatCoordinate } from "@/lib/location";
import {
  cancelServiceRequest,
  getServiceRequest,
  serviceRequestReference,
} from "@/lib/service-requests";
import type { ServiceRequest } from "@/types/service-request";
export default function Page() {
  const { id } = useParams<{ id: string }>(),
    search = useSearchParams(),
    [request, setRequest] = useState<ServiceRequest | null>(null),
    [error, setError] = useState(""),
    [cancelling, setCancelling] = useState(false);
  const load = useCallback(
    () =>
      getServiceRequest(Number(id))
        .then((r) => setRequest(r.request))
        .catch(() => setError("Service request not found.")),
    [id],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const coordinates = request
    ? coordinatesFromValues(request.latitude, request.longitude)
    : null;
  async function cancel() {
    if (!confirm("Cancel this service request?")) return;
    setCancelling(true);
    try {
      await cancelServiceRequest(Number(id));
      await load();
    } catch {
      setError("Unable to cancel this request.");
    } finally {
      setCancelling(false);
    }
  }
  return (
    <CitizenRoute>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/my-services" className="font-semibold text-emerald-700">
          ← My Service Requests
        </Link>
        {search.get("submitted") === "1" && (
          <p className="mt-6 rounded-lg bg-emerald-50 p-4 font-semibold text-emerald-800">
            Request submitted successfully.
          </p>
        )}
        {error ? (
          <p className="mt-8 text-red-700">{error}</p>
        ) : !request ? (
          <p className="mt-8">Loading request...</p>
        ) : (
          <>
            <header className="mt-6 rounded-2xl bg-slate-900 p-7 text-white">
              <p className="font-mono text-emerald-300">
                {serviceRequestReference(request.id)}
              </p>
              <h1 className="mt-2 text-3xl font-bold">
                {request.service.title}
              </h1>
              <div className="mt-4">
                <ServiceRequestStatusBadge status={request.status} />
              </div>
            </header>
            <section className="mt-6 grid gap-5 rounded-2xl border bg-white p-6 sm:grid-cols-2">
              <Info label="Department" value={request.department.name} />
              <Info
                label="Preferred Date"
                value={
                  request.preferredDate
                    ? formatDateTime(request.preferredDate)
                    : null
                }
              />
              <Info label="Contact Phone" value={request.contactPhone} />
              <Info
                label="Assigned Employee"
                value={
                  request.assignedEmployee
                    ? `${request.assignedEmployee.firstName} ${request.assignedEmployee.lastName}`
                    : "Not assigned yet"
                }
              />
              <Info
                label="Submitted"
                value={formatDateTime(request.submittedAt)}
              />
              <Info label="Address" value={request.address} />
              <div className="sm:col-span-2">
                <Info label="Description" value={request.description} />
              </div>
              {coordinates && (
                <Info
                  label="Coordinates"
                  value={`${formatCoordinate(coordinates.latitude)}, ${formatCoordinate(coordinates.longitude)}`}
                />
              )}{" "}
              {request.municipalityResponse && (
                <div className="sm:col-span-2 rounded-xl bg-emerald-50 p-4">
                  <Info
                    label="Municipality Response"
                    value={request.municipalityResponse}
                  />
                </div>
              )}
            </section>
            <ServiceRequestExtras request={request} />
            {coordinates && (
              <section className="mt-6">
                <ReportLocationMap
                  coordinates={coordinates}
                  title={request.service.title}
                />
              </section>
            )}
            <section className="mt-6 rounded-2xl border bg-white p-6">
              <h2 className="text-xl font-bold">Status History</h2>
              <ServiceRequestTimeline history={request.history ?? []} />
            </section>
            {["SUBMITTED", "UNDER_REVIEW"].includes(request.status) && (
              <button
                onClick={() => void cancel()}
                disabled={cancelling}
                className="mt-6 rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700"
              >
                {cancelling ? "Cancelling..." : "Cancel Request"}
              </button>
            )}
          </>
        )}
      </main>
    </CitizenRoute>
  );
}
function Info({ label, value }: { label: string; value: string | null }) {
  return value ? (
    <div>
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap">{value}</dd>
    </div>
  ) : null;
}
