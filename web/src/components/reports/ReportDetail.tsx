"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CitizenRoute } from "@/components/auth/ProtectedRoute";
import { PriorityBadge, StatusBadge } from "@/components/reports/ReportBadge";
import { ReportError, ReportLoading } from "@/components/reports/ReportStates";
import { ReportTimeline } from "@/components/reports/ReportTimeline";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { cancelReport, getReport } from "@/lib/reports";
import type { Report } from "@/types/report";

const cancellableStatuses = new Set(["SUBMITTED", "UNDER_REVIEW"]);

function ReportDetailContent({ reportId }: { reportId: string }) {
  const router = useRouter();
  const { logout } = useAuth();
  const numericId = Number(reportId);
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleApiError = useCallback(
    (caughtError: unknown, fallback: string) => {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      if (caughtError instanceof ApiError && caughtError.status === 403) {
        setError("You do not have permission to view or change this report.");
        return;
      }
      setError(caughtError instanceof ApiError ? caughtError.message : fallback);
    },
    [logout, router],
  );

  const loadReport = useCallback(async () => {
    await Promise.resolve();
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setError("This report link is invalid.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await getReport(numericId);
      setReport(response.report);
    } catch (caughtError) {
      handleApiError(caughtError, "Unable to load this report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, numericId]);

  useEffect(() => {
    let isCurrent = true;

    if (!Number.isInteger(numericId) || numericId <= 0) {
      Promise.resolve().then(() => {
        if (isCurrent) {
          setError("This report link is invalid.");
          setIsLoading(false);
        }
      });
    } else {
      void getReport(numericId)
        .then((response) => {
          if (isCurrent) setReport(response.report);
        })
        .catch((caughtError: unknown) => {
          if (isCurrent) handleApiError(caughtError, "Unable to load this report. Please try again.");
        })
        .finally(() => {
          if (isCurrent) setIsLoading(false);
        });
    }

    return () => {
      isCurrent = false;
    };
  }, [handleApiError, numericId]);

  async function confirmCancellation() {
    if (!report || isCancelling) return;
    setIsCancelling(true);
    setError("");
    try {
      const response = await cancelReport(report.id);
      setReport(response.report);
      setShowCancelConfirmation(false);
    } catch (caughtError) {
      handleApiError(caughtError, "Unable to cancel this report. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  }

  if (isLoading) return <PageContainer><ReportLoading message="Loading report details..." /></PageContainer>;
  if (error || !report) return <PageContainer><ReportError message={error || "Report not found."} onRetry={() => void loadReport()} /></PageContainer>;

  const canCancel = cancellableStatuses.has(report.status);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-14">
      <Link href="/reports" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">← Back to My Reports</Link>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap gap-2"><StatusBadge status={report.status} /><PriorityBadge priority={report.priority} /></div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{report.title}</h1>
            <p className="mt-2 font-semibold text-emerald-700">{report.category.name}</p>
          </div>
          {canCancel && !showCancelConfirmation && (
            <button type="button" onClick={() => setShowCancelConfirmation(true)} className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
              Cancel Report
            </button>
          )}
        </div>

        {showCancelConfirmation && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4" role="alertdialog" aria-labelledby="cancel-title" aria-describedby="cancel-description">
            <p id="cancel-title" className="font-semibold text-red-900">Cancel this report?</p>
            <p id="cancel-description" className="mt-1 text-sm text-red-700">This will stop the report from moving forward. This action cannot be undone from the citizen portal.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={() => void confirmCancellation()} disabled={isCancelling} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                {isCancelling ? "Cancelling..." : "Yes, Cancel Report"}
              </button>
              <button type="button" onClick={() => setShowCancelConfirmation(false)} disabled={isCancelling} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Keep Report</button>
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-slate-200 pt-7">
          <h2 className="text-lg font-bold text-slate-950">Description</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{report.description}</p>
        </div>

        <dl className="mt-8 grid gap-5 border-t border-slate-200 pt-7 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Address" value={report.addressText ?? "Not provided"} />
          <DetailItem label="Coordinates" value={coordinateLabel(report)} />
          <DetailItem label="Department" value={report.department?.name ?? "Not assigned yet"} />
          <DetailItem label="Assigned employee" value={report.assignedEmployee ? `${report.assignedEmployee.firstName} ${report.assignedEmployee.lastName}` : "Not assigned yet"} />
          <DetailItem label="Created" value={formatDateTime(report.createdAt)} />
          <DetailItem label="Updated" value={formatDateTime(report.updatedAt)} />
          {report.resolvedAt && <DetailItem label="Resolved" value={formatDateTime(report.resolvedAt)} />}
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-slate-950">Status Timeline</h2>
        <p className="mt-2 text-sm text-slate-600">Follow the progress of your report.</p>
        <div className="mt-7">
          <ReportTimeline history={report.statusHistory} />
        </div>
      </section>
    </main>
  );
}

function PageContainer({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-14">{children}</main>;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1.5 text-sm font-medium text-slate-900">{value}</dd></div>;
}

function coordinateLabel(report: Report): string {
  if (report.latitude === null || report.longitude === null) return "Not provided";
  return `${report.latitude}, ${report.longitude}`;
}

export function ReportDetail({ reportId }: { reportId: string }) {
  return <CitizenRoute><ReportDetailContent reportId={reportId} /></CitizenRoute>;
}
