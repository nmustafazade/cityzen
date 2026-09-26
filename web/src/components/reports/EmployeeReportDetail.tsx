"use client";

import Link from "next/link";
import Image, { type ImageLoader } from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { StaffRoute } from "@/components/auth/ProtectedRoute";
import { ReportLocationMap } from "@/components/maps/ReportLocationMap";
import { PriorityBadge, StatusBadge } from "@/components/reports/ReportBadge";
import { ReportComments } from "@/components/reports/ReportComments";
import { ReportImageGallery } from "@/components/reports/ReportImageGallery";
import { ReportError, ReportLoading } from "@/components/reports/ReportStates";
import { ReportTimeline } from "@/components/reports/ReportTimeline";
import { ResolutionFeedback } from "@/components/reports/ResolutionFeedback";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { formatDateTime, reportStatusLabels } from "@/lib/format";
import { coordinatesFromValues, formatCoordinate } from "@/lib/location";
import { getManagementDepartments, getManagementEmployees, type ManagementEmployee } from "@/lib/management";
import { assignReport, getReport, updateReportStatus } from "@/lib/reports";
import type { Department } from "@/types/department";
import type { Report, ReportStatus } from "@/types/report";

const statuses = Object.keys(reportStatusLabels) as ReportStatus[];
const profileImageLoader: ImageLoader = ({ src }) => src;

function EmployeeReportDetailContent({ reportId }: { reportId: string }) {
  const router = useRouter();
  const { logout } = useAuth();
  const numericId = Number(reportId);
  const [report, setReport] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState<ReportStatus | "">("");
  const [note, setNote] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<ManagementEmployee[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleApiError = useCallback((caughtError: unknown, fallback: string) => {
    if (caughtError instanceof ApiError && caughtError.status === 401) {
      logout();
      router.replace("/login");
      return;
    }
    if (caughtError instanceof ApiError && caughtError.status === 403) {
      setError("You do not have permission to manage this report.");
      return;
    }
    if (caughtError instanceof ApiError && caughtError.status === 404) {
      setError("Report not found.");
      return;
    }
    setError(caughtError instanceof ApiError ? caughtError.message : fallback);
  }, [logout, router]);

  const loadReport = useCallback(async () => {
    await Promise.resolve();
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setError("Report not found.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await getReport(numericId);
      setReport(response.report);
      setNewStatus("");
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
          setError("Report not found.");
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

  useEffect(() => {
    let isCurrent = true;
    void getManagementDepartments()
      .then((response) => { if (isCurrent) setDepartments(response.departments); })
      .catch((caughtError: unknown) => { if (isCurrent) handleApiError(caughtError, "Unable to load departments."); });
    return () => { isCurrent = false; };
  }, [handleApiError]);

  async function handleDepartmentChange(value: string) {
    setDepartmentId(value);
    setEmployeeId("");
    setEmployees([]);
    setSuccessMessage("");
    if (!value) return;
    setIsLoadingEmployees(true);
    setError("");
    try {
      const response = await getManagementEmployees(Number(value));
      setEmployees(response.employees);
    } catch (caughtError) {
      handleApiError(caughtError, "Unable to load employees for this department.");
    } finally {
      setIsLoadingEmployees(false);
    }
  }

  async function handleAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!report || !departmentId || !employeeId || isAssigning) return;
    setIsAssigning(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await assignReport(report.id, {
        departmentId: Number(departmentId),
        employeeId: Number(employeeId),
      });
      setReport({
        ...response.report,
        upvoteCount: report.upvoteCount,
        hasUpvoted: report.hasUpvoted,
      });
      setSuccessMessage("Report assigned successfully.");
    } catch (caughtError) {
      handleApiError(caughtError, "Unable to assign this report. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleStatusUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!report || !newStatus || newStatus === report.status || isUpdating) return;
    if (note.trim().length > 180) {
      setError("Status note must be 180 characters or fewer.");
      return;
    }

    setIsUpdating(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await updateReportStatus(report.id, {
        status: newStatus,
        note: note.trim() || undefined,
      });
      setReport({
        ...response.report,
        upvoteCount: report.upvoteCount,
        hasUpvoted: report.hasUpvoted,
      });
      setNewStatus("");
      setNote("");
      setSuccessMessage("Report status updated successfully.");
    } catch (caughtError) {
      handleApiError(caughtError, "Unable to update this report. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) return <PageContainer><ReportLoading message="Loading report details..." /></PageContainer>;
  if (error && !report) return <PageContainer><ReportError message={error} onRetry={() => void loadReport()} /></PageContainer>;
  if (!report) return <PageContainer><ReportError message="Report not found." onRetry={() => void loadReport()} /></PageContainer>;
  const reportCoordinates = coordinatesFromValues(report.latitude, report.longitude);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:py-14">
      <Link href="/employee/reports" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">← Back to Report Management</Link>

      <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Report #{report.id}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{report.title}</h1>
          <p className="mt-2 font-semibold text-emerald-700">{report.category.name}</p>
        </div>
        <div className="flex flex-wrap gap-2"><StatusBadge status={report.status} /><PriorityBadge priority={report.priority} /></div>
      </div>

      {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {successMessage && <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <Section title="Issue Details">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{report.description}</p>
            <dl className="mt-6 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
              <DetailItem label="Report ID" value={`#${report.id}`} />
              <DetailItem label="Category" value={report.category.name} />
              <DetailItem label="Status" value={reportStatusLabels[report.status]} />
              <DetailItem label="Priority" value={report.priority.charAt(0) + report.priority.slice(1).toLowerCase()} />
              <DetailItem label="Created" value={formatDateTime(report.createdAt)} />
              <DetailItem label="Updated" value={formatDateTime(report.updatedAt)} />
              {report.resolvedAt && <DetailItem label="Resolved" value={formatDateTime(report.resolvedAt)} />}
            </dl>
          </Section>

          <Section title="Location">
            <dl className="grid gap-5 sm:grid-cols-3">
              <DetailItem label="Address" value={report.addressText ?? "Not provided"} />
              <DetailItem label="Latitude" value={reportCoordinates ? formatCoordinate(reportCoordinates.latitude) : "Not provided"} />
              <DetailItem label="Longitude" value={reportCoordinates ? formatCoordinate(reportCoordinates.longitude) : "Not provided"} />
            </dl>
            {reportCoordinates && <div className="mt-5"><ReportLocationMap coordinates={reportCoordinates} title={report.title} /></div>}
          </Section>

          <Section title="Photos">
            <ReportImageGallery images={report.images} reportTitle={report.title} />
          </Section>

          <Section title="Status History">
            <ReportTimeline history={report.statusHistory} />
          </Section>
        </div>

        <aside className="space-y-6">
          <Section title="Citizen">
            <CitizenSummary report={report} />
          </Section>

          <Section title="Community Support">
            <p className="text-2xl font-bold text-slate-950">{report.upvoteCount ?? 0}</p>
            <p className="mt-1 text-sm text-slate-600">upvotes</p>
          </Section>

          <Section title="Assignment">
            <dl className="space-y-5">
              <DetailItem label="Department" value={report.department?.name ?? "Not assigned"} />
              <DetailItem label="Assigned employee" value={report.assignedEmployee ? `${report.assignedEmployee.firstName} ${report.assignedEmployee.lastName}` : "Not assigned"} />
            </dl>
            <form onSubmit={handleAssignment} className="mt-6 space-y-4 border-t border-slate-100 pt-5">
              <div>
                <label htmlFor="assignment-department" className="mb-1.5 block text-sm font-semibold text-slate-800">Department</label>
                <select id="assignment-department" value={departmentId} onChange={(event) => void handleDepartmentChange(event.target.value)} disabled={isAssigning} className={inputStyle}>
                  <option value="">Select a department</option>
                  {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="assignment-employee" className="mb-1.5 block text-sm font-semibold text-slate-800">Employee</label>
                <select id="assignment-employee" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} disabled={!departmentId || isLoadingEmployees || isAssigning} className={inputStyle}>
                  <option value="">{isLoadingEmployees ? "Loading employees..." : "Select an employee"}</option>
                  {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}
                </select>
                {departmentId && !isLoadingEmployees && employees.length === 0 && <p className="mt-2 text-xs text-amber-700">No active employees in this department.</p>}
              </div>
              <button type="submit" disabled={!departmentId || !employeeId || isAssigning} className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-400">
                {isAssigning ? "Assigning..." : "Assign Report"}
              </button>
            </form>
          </Section>

          <Section title="Status Management">
            <p className="text-sm text-slate-600">Current status: <span className="font-semibold text-slate-900">{reportStatusLabels[report.status]}</span></p>
            <form onSubmit={handleStatusUpdate} className="mt-5 space-y-4">
              <div>
                <label htmlFor="new-status" className="mb-1.5 block text-sm font-semibold text-slate-800">New Status</label>
                <select id="new-status" value={newStatus} onChange={(event) => { setNewStatus(event.target.value as ReportStatus | ""); setSuccessMessage(""); }} disabled={isUpdating} className={inputStyle}>
                  <option value="">Select a new status</option>
                  {statuses.filter((status) => status !== report.status).map((status) => <option key={status} value={status}>{reportStatusLabels[status]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="status-note" className="mb-1.5 block text-sm font-semibold text-slate-800">Note <span className="font-normal text-slate-500">(optional)</span></label>
                <textarea id="status-note" rows={4} maxLength={180} value={note} onChange={(event) => { setNote(event.target.value); setSuccessMessage(""); }} disabled={isUpdating} placeholder={newStatus === "REJECTED" ? "Explain why this report is being rejected." : "Add context for this status change."} className={inputStyle} />
                <p className="mt-1 text-right text-xs text-slate-400">{note.length}/180</p>
              </div>
              <button type="submit" disabled={!newStatus || isUpdating} className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-400">
                {isUpdating ? "Updating..." : "Update Status"}
              </button>
            </form>
          </Section>
        </aside>
      </div>

      {report.status === "RESOLVED" && <div className="mt-6"><ResolutionFeedback reportId={report.id} editable={false} /></div>}
      <div className="mt-6"><ReportComments reportId={report.id} /></div>
    </main>
  );
}

const inputStyle = "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100 disabled:bg-slate-100";

function PageContainer({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:py-14">{children}</main>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-950">{title}</h2><div className="mt-5">{children}</div></section>;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1.5 text-sm font-medium text-slate-900 break-words">{value}</dd></div>;
}

function CitizenSummary({ report }: { report: Report }) {
  if (!report.citizen) return <p className="text-sm text-slate-600">Citizen information unavailable.</p>;
  const name = `${report.citizen.firstName} ${report.citizen.lastName}`;
  return (
    <div className="flex items-center gap-3">
      {report.citizen.profileImageUrl ? (
        <Image loader={profileImageLoader} unoptimized src={report.citizen.profileImageUrl} alt={`${name} profile`} width={44} height={44} className="size-11 rounded-full object-cover" />
      ) : (
        <div className="flex size-11 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800" aria-hidden="true">{report.citizen.firstName.charAt(0)}{report.citizen.lastName.charAt(0)}</div>
      )}
      <div><p className="font-semibold text-slate-950">{name}</p><p className="text-xs text-slate-500">Citizen</p></div>
    </div>
  );
}

export function EmployeeReportDetail({ reportId }: { reportId: string }) {
  return <StaffRoute><EmployeeReportDetailContent reportId={reportId} /></StaffRoute>;
}
