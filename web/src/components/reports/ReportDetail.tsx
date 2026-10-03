"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CitizenRoute } from "@/components/auth/ProtectedRoute";
import { ReportLocationMap } from "@/components/maps/ReportLocationMap";
import { PriorityBadge, StatusBadge } from "@/components/reports/ReportBadge";
import { ReportError, ReportLoading } from "@/components/reports/ReportStates";
import { ReportImageGallery } from "@/components/reports/ReportImageGallery";
import { ReportImagePicker } from "@/components/reports/ReportImagePicker";
import { ReportComments } from "@/components/reports/ReportComments";
import { ResolutionFeedback } from "@/components/reports/ResolutionFeedback";
import { ReportTimeline } from "@/components/reports/ReportTimeline";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { coordinatesFromValues, formatCoordinate } from "@/lib/location";
import {
  cancelReport,
  getReport,
  setReportVisibility,
  uploadReportImages,
} from "@/lib/reports";
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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [interactionError, setInteractionError] = useState("");

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
      setError(
        caughtError instanceof ApiError ? caughtError.message : fallback,
      );
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
      handleApiError(
        caughtError,
        "Unable to load this report. Please try again.",
      );
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
          if (isCurrent)
            handleApiError(
              caughtError,
              "Unable to load this report. Please try again.",
            );
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
      setReport({
        ...response.report,
        upvoteCount: report.upvoteCount,
        hasUpvoted: report.hasUpvoted,
      });
      setShowCancelConfirmation(false);
    } catch (caughtError) {
      handleApiError(
        caughtError,
        "Unable to cancel this report. Please try again.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  async function uploadImages() {
    if (!report || selectedImages.length === 0 || isUploading) return;
    setIsUploading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await uploadReportImages(report.id, selectedImages);
      setReport({ ...report, images: [...report.images, ...response.images] });
      setSelectedImages([]);
      setPickerKey((current) => current + 1);
      setSuccessMessage("Photos uploaded successfully.");
    } catch (caughtError) {
      handleApiError(caughtError, "Unable to upload photos. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function toggleVisibility() {
    if (!report || isUpvoting) return;
    setIsUpvoting(true);
    setInteractionError("");
    try {
      const response = await setReportVisibility(report.id, !report.isPublic);
      setReport({ ...report, isPublic: response.report.isPublic });
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
      } else {
        setInteractionError(
          caughtError instanceof ApiError
            ? caughtError.message
            : "Unable to update public visibility.",
        );
      }
    } finally {
      setIsUpvoting(false);
    }
  }

  if (isLoading)
    return (
      <PageContainer>
        <ReportLoading message="Loading report details..." />
      </PageContainer>
    );
  if (error && !report)
    return (
      <PageContainer>
        <ReportError message={error} onRetry={() => void loadReport()} />
      </PageContainer>
    );
  if (!report)
    return (
      <PageContainer>
        <ReportError
          message="Report not found."
          onRetry={() => void loadReport()}
        />
      </PageContainer>
    );

  const canCancel = cancellableStatuses.has(report.status);
  const canUpload = canCancel && report.images.length < 5;
  const reportCoordinates = coordinatesFromValues(
    report.latitude,
    report.longitude,
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-14">
      <Link
        href="/reports"
        className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        ← Back to My Reports
      </Link>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={report.status} />
              <PriorityBadge priority={report.priority} />
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
              {report.title}
            </h1>
            <p className="mt-2 font-semibold text-emerald-700">
              {report.category.name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={Boolean(report.isPublic)}
              onClick={() => void toggleVisibility()}
              disabled={isUpvoting}
              className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-60 ${report.isPublic ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-300 text-slate-700 hover:border-emerald-600"}`}
            >
              {report.isPublic ? "Publicly Shared" : "Share Publicly"}
            </button>
            {canCancel && !showCancelConfirmation && (
              <button
                type="button"
                onClick={() => setShowCancelConfirmation(true)}
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                Cancel Report
              </button>
            )}
          </div>
        </div>

        {interactionError && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {interactionError}
          </p>
        )}

        {showCancelConfirmation && (
          <div
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4"
            role="alertdialog"
            aria-labelledby="cancel-title"
            aria-describedby="cancel-description"
          >
            <p id="cancel-title" className="font-semibold text-red-900">
              Cancel this report?
            </p>
            <p id="cancel-description" className="mt-1 text-sm text-red-700">
              This will stop the report from moving forward. This action cannot
              be undone from the citizen portal.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void confirmCancellation()}
                disabled={isCancelling}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel Report"}
              </button>
              <button
                type="button"
                onClick={() => setShowCancelConfirmation(false)}
                disabled={isCancelling}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Keep Report
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-slate-200 pt-7">
          <h2 className="text-lg font-bold text-slate-950">Description</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {report.description}
          </p>
        </div>

        <dl className="mt-8 grid gap-5 border-t border-slate-200 pt-7 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Address"
            value={report.addressText ?? "Not provided"}
          />
          <DetailItem label="Coordinates" value={coordinateLabel(report)} />
          <DetailItem
            label="Department"
            value={report.department?.name ?? "Not assigned yet"}
          />
          <DetailItem
            label="Assigned employee"
            value={
              report.assignedEmployee
                ? `${report.assignedEmployee.firstName} ${report.assignedEmployee.lastName}`
                : "Not assigned yet"
            }
          />
          <DetailItem
            label="Created"
            value={formatDateTime(report.createdAt)}
          />
          <DetailItem
            label="Updated"
            value={formatDateTime(report.updatedAt)}
          />
          {report.resolvedAt && (
            <DetailItem
              label="Resolved"
              value={formatDateTime(report.resolvedAt)}
            />
          )}
        </dl>
      </section>

      {reportCoordinates && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-950">Location</h2>
          {report.addressText && (
            <p className="mt-2 text-sm text-slate-600">{report.addressText}</p>
          )}
          <p className="mt-2 text-sm text-slate-600">
            Latitude: {formatCoordinate(reportCoordinates.latitude)} ·
            Longitude: {formatCoordinate(reportCoordinates.longitude)}
          </p>
          <div className="mt-5">
            <ReportLocationMap
              coordinates={reportCoordinates}
              title={report.title}
            />
          </div>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-slate-950">Photos</h2>
        <p className="mt-2 text-sm text-slate-600">
          Photos help municipality teams understand the issue.
        </p>
        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        {successMessage && (
          <div
            role="status"
            className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {successMessage}
          </div>
        )}
        <div className="mt-6">
          <ReportImageGallery
            images={report.images}
            reportTitle={report.title}
          />
        </div>

        {canUpload && (
          <div className="mt-7 border-t border-slate-200 pt-6">
            <h3 className="font-bold text-slate-950">Add Photos</h3>
            <div className="mt-4">
              <ReportImagePicker
                key={pickerKey}
                maxFiles={5 - report.images.length}
                onFilesChange={setSelectedImages}
                disabled={isUploading}
              />
            </div>
            <button
              type="button"
              onClick={() => void uploadImages()}
              disabled={selectedImages.length === 0 || isUploading}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {isUploading ? "Uploading..." : "Upload Photos"}
            </button>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-slate-950">Status Timeline</h2>
        <p className="mt-2 text-sm text-slate-600">
          Follow the progress of your report.
        </p>
        <div className="mt-7">
          <ReportTimeline history={report.statusHistory} />
        </div>
      </section>

      {report.status === "RESOLVED" && (
        <div className="mt-6">
          <ResolutionFeedback reportId={report.id} editable />
        </div>
      )}

      <div className="mt-6">
        <ReportComments reportId={report.id} />
      </div>
    </main>
  );
}

function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-14">
      {children}
    </main>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function coordinateLabel(report: Report): string {
  if (report.latitude === null || report.longitude === null)
    return "Not provided";
  return `${report.latitude}, ${report.longitude}`;
}

export function ReportDetail({ reportId }: { reportId: string }) {
  return (
    <CitizenRoute>
      <ReportDetailContent reportId={reportId} />
    </CitizenRoute>
  );
}
