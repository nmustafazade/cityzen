"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CitizenRoute } from "@/components/auth/ProtectedRoute";
import { PriorityBadge, StatusBadge } from "@/components/reports/ReportBadge";
import { ReportError, ReportLoading } from "@/components/reports/ReportStates";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { formatDateTime, reportStatusLabels } from "@/lib/format";
import { getMyReports, getReportCategories } from "@/lib/reports";
import type {
  Report,
  ReportCategory,
  ReportPagination,
  ReportStatus,
} from "@/types/report";

const statuses = Object.keys(reportStatusLabels) as ReportStatus[];
const defaultPagination: ReportPagination = { page: 1, limit: 10, total: 0, totalPages: 0 };

function MyReportsContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [pagination, setPagination] = useState(defaultPagination);
  const [status, setStatus] = useState<ReportStatus | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const handleApiError = useCallback(
    (caughtError: unknown) => {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to load your reports. Please try again.",
      );
    },
    [logout, router],
  );

  const loadReports = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    setError("");
    try {
      const response = await getMyReports({
        status: status || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        page,
        limit: 10,
      });
      setReports(response.reports);
      setPagination(response.pagination);
    } catch (caughtError) {
      handleApiError(caughtError);
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, handleApiError, page, status]);

  useEffect(() => {
    void getReportCategories()
      .then((response) => setCategories(response.categories))
      .catch(handleApiError);
  }, [handleApiError]);

  useEffect(() => {
    let isCurrent = true;
    void getMyReports({
      status: status || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      page,
      limit: 10,
    })
      .then((response) => {
        if (!isCurrent) return;
        setReports(response.reports);
        setPagination(response.pagination);
      })
      .catch((caughtError: unknown) => {
        if (isCurrent) handleApiError(caughtError);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [categoryId, handleApiError, page, status]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:py-14">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Citizen reports</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">My Reports</h1>
          <p className="mt-3 text-slate-600">Track the issues you have reported to the city.</p>
        </div>
        <Link href="/reports/new" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
          Report an Issue
        </Link>
      </div>

      <section aria-label="Report filters" className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <FilterSelect
          id="report-status"
          label="Status"
          value={status}
          onChange={(value) => {
            setIsLoading(true);
            setError("");
            setStatus(value as ReportStatus | "");
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {statuses.map((item) => <option key={item} value={item}>{reportStatusLabels[item]}</option>)}
        </FilterSelect>
        <FilterSelect
          id="report-category"
          label="Category"
          value={categoryId}
          onChange={(value) => {
            setIsLoading(true);
            setError("");
            setCategoryId(value);
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </FilterSelect>
      </section>

      <section className="mt-6" aria-live="polite">
        {isLoading ? (
          <ReportLoading />
        ) : error ? (
          <ReportError message={error} onRetry={() => void loadReports()} />
        ) : reports.length === 0 ? (
          <EmptyReports />
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              {reports.map((report) => <ReportCard key={report.id} report={report} />)}
            </div>
            <Pagination
              pagination={pagination}
              onPrevious={() => {
                setIsLoading(true);
                setPage((current) => Math.max(1, current - 1));
              }}
              onNext={() => {
                setIsLoading(true);
                setPage((current) => current + 1);
              }}
            />
          </>
        )}
      </section>
    </main>
  );
}

function FilterSelect({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-800">{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100">
        {children}
      </select>
    </div>
  );
}

function ReportCard({ report }: { report: Report }) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap gap-2"><StatusBadge status={report.status} /><PriorityBadge priority={report.priority} /></div>
      <h2 className="mt-4 text-xl font-bold text-slate-950">{report.title}</h2>
      <p className="mt-1 text-sm font-medium text-emerald-700">{report.category.name}</p>
      <dl className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div><dt className="font-semibold text-slate-800">Reported</dt><dd className="mt-1">{formatDateTime(report.createdAt)}</dd></div>
        <div><dt className="font-semibold text-slate-800">Department</dt><dd className="mt-1">{report.department?.name ?? "Not assigned yet"}</dd></div>
        {report.addressText && <div className="sm:col-span-2"><dt className="font-semibold text-slate-800">Address</dt><dd className="mt-1">{report.addressText}</dd></div>}
      </dl>
      <Link href={`/reports/${report.id}`} className="mt-6 inline-flex w-fit text-sm font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
        View Details <span aria-hidden="true" className="ml-1">→</span>
      </Link>
    </article>
  );
}

function EmptyReports() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-xl text-emerald-700" aria-hidden="true">!</div>
      <h2 className="mt-4 text-xl font-bold text-slate-950">No reports yet</h2>
      <p className="mt-2 text-sm text-slate-600">You haven&apos;t reported any city issues.</p>
      <Link href="/reports/new" className="mt-6 inline-flex rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">Report Your First Issue</Link>
    </div>
  );
}

function Pagination({ pagination, onPrevious, onNext }: { pagination: ReportPagination; onPrevious: () => void; onNext: () => void }) {
  const totalPages = Math.max(1, pagination.totalPages);
  return (
    <nav aria-label="Reports pagination" className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
      <button type="button" onClick={onPrevious} disabled={pagination.page <= 1} className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
      <span className="text-sm font-medium text-slate-600">Page {pagination.page} of {totalPages}</span>
      <button type="button" onClick={onNext} disabled={pagination.page >= totalPages} className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
    </nav>
  );
}

export default function MyReportsPage() {
  return <CitizenRoute><MyReportsContent /></CitizenRoute>;
}
