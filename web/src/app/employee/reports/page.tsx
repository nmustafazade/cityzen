"use client";
import { useQueryState } from "@/hooks/useQueryState";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { StaffRoute } from "@/components/auth/ProtectedRoute";
import { PriorityBadge, StatusBadge } from "@/components/reports/ReportBadge";
import { ReportError, ReportLoading } from "@/components/reports/ReportStates";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import {
  formatDateTime,
  reportPriorityLabels,
  reportStatusLabels,
} from "@/lib/format";
import { getReportCategories, getReports } from "@/lib/reports";
import type {
  Report,
  ReportCategory,
  ReportPagination,
  ReportPriority,
  ReportStatus,
} from "@/types/report";

type SortOption = "newest" | "updated" | "priority";

const statuses = Object.keys(reportStatusLabels) as ReportStatus[];
const priorities = Object.keys(reportPriorityLabels) as ReportPriority[];
const defaultPagination: ReportPagination = { page: 1, limit: 10, total: 0, totalPages: 0 };

function ReportManagementContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [pagination, setPagination] = useState(defaultPagination);
  const [status, setStatus] = useQueryState<ReportStatus | "">("status", "");
  const [priority, setPriority] = useQueryState<ReportPriority | "">("priority", "");
  const [categoryId, setCategoryId] = useQueryState<string>("categoryId", "");
  const [sort, setSort] = useQueryState<SortOption>("sort", "newest");
  const [page, setPage] = useQueryState<number>("page", 1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const handleApiError = useCallback((caughtError: unknown) => {
    if (caughtError instanceof ApiError && caughtError.status === 401) {
      logout();
      router.replace("/login");
      return;
    }
    if (caughtError instanceof ApiError && caughtError.status === 403) {
      setError("You do not have permission to manage reports.");
      return;
    }
    setError(caughtError instanceof ApiError ? caughtError.message : "Unable to load reports. Please try again.");
  }, [logout, router]);

  const currentParams = useCallback(() => {
    const sortParams = sort === "updated"
      ? { sortBy: "updatedAt" as const, sortOrder: "desc" as const }
      : sort === "priority"
        ? { sortBy: "priority" as const, sortOrder: "desc" as const }
        : { sortBy: "createdAt" as const, sortOrder: "desc" as const };

    return {
      status: status || undefined,
      priority: priority || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      page,
      limit: 10,
      ...sortParams,
    };
  }, [categoryId, page, priority, sort, status]);

  const loadReports = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    setError("");
    try {
      const response = await getReports(currentParams());
      setReports(response.reports);
      setPagination(response.pagination);
    } catch (caughtError) {
      handleApiError(caughtError);
    } finally {
      setIsLoading(false);
    }
  }, [currentParams, handleApiError]);

  useEffect(() => {
    let isCurrent = true;
    void getReportCategories()
      .then((response) => {
        if (isCurrent) setCategories(response.categories);
      })
      .catch((caughtError: unknown) => {
        if (isCurrent) handleApiError(caughtError);
      });
    return () => {
      isCurrent = false;
    };
  }, [handleApiError]);

  useEffect(() => {
    let isCurrent = true;
    void getReports(currentParams())
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
  }, [currentParams, handleApiError]);

  function changeFilter(update: () => void) {
    setIsLoading(true);
    setError("");
    setPage(1);
    update();
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 sm:py-14">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Municipality workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Report Management</h1>
        <p className="mt-3 text-slate-600">Review and manage city issue reports.</p>
      </div>

      <section aria-label="Report filters" className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect label="Status" value={status} onChange={(value) => changeFilter(() => setStatus(value as ReportStatus | ""))}>
          <option value="">All Statuses</option>
          {statuses.map((item) => <option key={item} value={item}>{reportStatusLabels[item]}</option>)}
        </FilterSelect>
        <FilterSelect label="Priority" value={priority} onChange={(value) => changeFilter(() => setPriority(value as ReportPriority | ""))}>
          <option value="">All Priorities</option>
          {priorities.map((item) => <option key={item} value={item}>{reportPriorityLabels[item]}</option>)}
        </FilterSelect>
        <FilterSelect label="Category" value={categoryId} onChange={(value) => changeFilter(() => setCategoryId(value))}>
          <option value="">All Categories</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </FilterSelect>
        <FilterSelect label="Sort by" value={sort} onChange={(value) => changeFilter(() => setSort(value as SortOption))}>
          <option value="newest">Newest</option>
          <option value="updated">Recently Updated</option>
          <option value="priority">Priority</option>
        </FilterSelect>
      </section>

      <section className="mt-6" aria-live="polite">
        {isLoading ? (
          <ReportLoading message="Loading report management..." />
        ) : error ? (
          <ReportError message={error} onRetry={() => void loadReports()} />
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <h2 className="text-xl font-bold text-slate-950">No reports found</h2>
            <p className="mt-2 text-sm text-slate-600">Try changing your filters.</p>
          </div>
        ) : (
          <>
            <DesktopReportTable reports={reports} />
            <MobileReportCards reports={reports} />
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

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  const id = `filter-${label.toLowerCase().replaceAll(" ", "-")}`;
  return <div><label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-800">{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100">{children}</select></div>;
}

function DesktopReportTable({ reports }: { reports: Report[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
      <table className="min-w-[1100px] w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>{["ID", "Issue", "Category", "Citizen", "Status", "Priority", "Department", "Assigned To", "Created", "Action"].map((heading) => <th key={heading} scope="col" className="px-4 py-3 font-semibold">{heading}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {reports.map((report) => (
            <tr key={report.id} className="align-top hover:bg-slate-50/70">
              <td className="px-4 py-4 font-semibold text-slate-700">#{report.id}</td>
              <td className="max-w-60 px-4 py-4"><p className="font-semibold text-slate-950">{report.title}</p></td>
              <td className="px-4 py-4 text-slate-600">{report.category.name}</td>
              <td className="px-4 py-4 text-slate-600">{personName(report.citizen, "Unavailable")}</td>
              <td className="px-4 py-4"><StatusBadge status={report.status} /></td>
              <td className="px-4 py-4"><PriorityBadge priority={report.priority} /></td>
              <td className="px-4 py-4 text-slate-600">{report.department?.name ?? "Not assigned"}</td>
              <td className="px-4 py-4 text-slate-600">{personName(report.assignedEmployee)}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDateTime(report.createdAt)}</td>
              <td className="px-4 py-4"><Link href={`/employee/reports/${report.id}`} className="font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileReportCards({ reports }: { reports: Report[] }) {
  return <div className="grid gap-4 md:hidden">{reports.map((report) => <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-slate-500">#{report.id}</span><StatusBadge status={report.status} /></div><h2 className="mt-4 text-lg font-bold text-slate-950">{report.title}</h2><p className="mt-1 text-sm font-medium text-emerald-700">{report.category.name}</p><div className="mt-4"><PriorityBadge priority={report.priority} /></div><dl className="mt-5 grid gap-3 text-sm"><CompactItem label="Citizen" value={personName(report.citizen, "Unavailable")} /><CompactItem label="Department" value={report.department?.name ?? "Not assigned"} /><CompactItem label="Assigned to" value={personName(report.assignedEmployee)} /><CompactItem label="Created" value={formatDateTime(report.createdAt)} /></dl><Link href={`/employee/reports/${report.id}`} className="mt-5 inline-flex font-semibold text-emerald-700 hover:text-emerald-800">View Report →</Link></article>)}</div>;
}

function CompactItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-slate-800">{value}</dd></div>;
}

function personName(
  person: Report["citizen"] | Report["assignedEmployee"],
  fallback = "Not assigned",
): string {
  return person ? `${person.firstName} ${person.lastName}` : fallback;
}

function Pagination({ pagination, onPrevious, onNext }: { pagination: ReportPagination; onPrevious: () => void; onNext: () => void }) {
  const totalPages = Math.max(1, pagination.totalPages);
  return <nav aria-label="Report management pagination" className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"><button type="button" onClick={onPrevious} disabled={pagination.page <= 1} className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="text-sm font-medium text-slate-600">Page {pagination.page} of {totalPages}</span><button type="button" onClick={onNext} disabled={pagination.page >= totalPages} className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">Next</button></nav>;
}

export default function ReportManagementPage() {
  return <StaffRoute><ReportManagementContent /></StaffRoute>;
}
