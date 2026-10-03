"use client";
/* The initial date snapshot and initial data load intentionally happen once for this client-only dashboard. */
/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import {
  downloadAnalyticsCsv,
  getAnalyticsOverview,
  getFeedbackAnalytics,
  getReportAnalytics,
  getServiceAnalytics,
  getTrends,
  getWorkloadAnalytics,
  type AnalyticsParams,
} from "@/lib/analytics";
import { summarizeAnalytics } from "@/lib/ai";
import { getManagementDepartments } from "@/lib/management";
import { useAuth } from "@/context/AuthContext";
import type {
  AnalyticsOverview,
  FeedbackAnalytics,
  ReportAnalytics,
  ServiceAnalytics,
  TrendPoint,
  WorkloadAnalytics,
} from "@/types/analytics";
import type { Department } from "@/types/department";
const day = (date: Date) => date.toISOString().slice(0, 10),
  card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((x) => x.value));
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex justify-between text-sm">
            <span>{row.label.replaceAll("_", " ")}</span>
            <strong>{row.value}</strong>
          </div>
          <div
            className="mt-1 h-2 overflow-hidden rounded bg-slate-100"
            aria-hidden
          >
            <div
              className="h-full rounded bg-emerald-500"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
export function AnalyticsDashboard({
  departmentId,
}: {
  departmentId?: number;
}) {
  const { user } = useAuth(),
    [selectedDepartment, setSelectedDepartment] = useState(
      departmentId ? String(departmentId) : "",
    ),
    [departments, setDepartments] = useState<Department[]>([]),
    [to, setTo] = useState(day(new Date())),
    [from, setFrom] = useState(day(new Date(Date.now() - 30 * 86400000))),
    [data, setData] = useState<{
      overview: AnalyticsOverview;
      reports: ReportAnalytics;
      services: ServiceAnalytics;
      feedback: FeedbackAnalytics;
      workload: WorkloadAnalytics;
      trends: TrendPoint[];
    } | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [insight, setInsight] = useState("");
  const effectiveDepartment = selectedDepartment
      ? Number(selectedDepartment)
      : departmentId,
    params: AnalyticsParams = { from, to, departmentId: effectiveDepartment };
  useEffect(() => {
    if (user?.role === "ADMIN")
      void getManagementDepartments()
        .then((x) => setDepartments(x.departments))
        .catch(() => undefined);
  }, [user?.role]);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const p: AnalyticsParams = {
        from,
        to,
        departmentId: effectiveDepartment,
      };
      const [overview, reports, services, feedback, workload, trends] =
        await Promise.all([
          getAnalyticsOverview(p),
          getReportAnalytics(p),
          getServiceAnalytics(p),
          getFeedbackAnalytics(p),
          getWorkloadAnalytics(p),
          getTrends(p),
        ]);
      setData({ overview, reports, services, feedback, workload, trends });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load analytics");
    } finally {
      setLoading(false);
    }
  }, [from, to, effectiveDepartment]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">
            Municipality intelligence
          </p>
          <h1 className="mt-2 text-3xl font-bold">Analytics</h1>
          <p className="mt-2 text-slate-600">
            Aggregate operational metrics. No citizen identities or exact
            locations are displayed.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {user?.role === "ADMIN" && (
            <label className="text-sm font-semibold">
              Department
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="ml-2 rounded-lg border px-3 py-2"
              >
                <option value="">All departments</option>
                {departments.map((x) => (
                  <option value={x.id} key={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-sm font-semibold">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="ml-2 rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm font-semibold">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="ml-2 rounded-lg border px-3 py-2"
            />
          </label>
        </div>
      </div>
      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl bg-rose-50 p-4 text-rose-800"
        >
          {error}{" "}
          <button onClick={() => void load()} className="font-bold underline">
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <p className="mt-10 text-slate-600">Loading analytics...</p>
      ) : (
        data && (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Reports", data.overview.reports.total],
                ["Open reports", data.overview.reports.open],
                ["Service requests", data.overview.serviceRequests.total],
                [
                  "Average rating",
                  data.overview.citizenFeedback.averageRating ?? "No feedback",
                ],
              ].map(([label, value]) => (
                <article className={card} key={label}>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold">{value}</p>
                </article>
              ))}
            </section>
            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <article className={card}>
                <h2 className="mb-5 text-lg font-bold">Report status</h2>
                <Bars
                  rows={data.reports.statusBreakdown.map((x) => ({
                    label: x.status ?? "Unknown",
                    value: x.count,
                  }))}
                />
              </article>
              <article className={card}>
                <h2 className="mb-5 text-lg font-bold">Popular services</h2>
                <Bars
                  rows={data.services.mostUsedServices
                    .slice(0, 8)
                    .map((x) => ({ label: x.service, value: x.count }))}
                />
              </article>
              <article className={card}>
                <h2 className="mb-5 text-lg font-bold">Workload</h2>
                <p>
                  {data.workload.reports.unassigned} unassigned reports ·{" "}
                  {data.workload.serviceRequests.unassigned} unassigned requests
                </p>
                <div className="mt-4">
                  <Bars
                    rows={data.workload.employees.map((x) => ({
                      label: x.name,
                      value: x.assignedReports + x.assignedServiceRequests,
                    }))}
                  />
                </div>
              </article>
              <article className={card}>
                <h2 className="mb-5 text-lg font-bold">Trend periods</h2>
                <div className="max-h-72 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th>Period</th>
                        <th>Reports</th>
                        <th>Resolved</th>
                        <th>Requests</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.trends.map((x) => (
                        <tr key={x.bucket} className="border-t">
                          <td className="py-2">{x.bucket}</td>
                          <td>{x.reportsCreated}</td>
                          <td>{x.reportsResolved}</td>
                          <td>{x.requestsSubmitted}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
            <section className={`${card} mt-6`}>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    void summarizeAnalytics(params).then((x) =>
                      setInsight(x.summary ?? ""),
                    )
                  }
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white"
                >
                  Generate factual summary
                </button>
                {(["reports", "service-requests", "feedback"] as const).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => void downloadAnalyticsCsv(type, params)}
                      className="rounded-lg border px-4 py-2 font-semibold"
                    >
                      Export {type} CSV
                    </button>
                  ),
                )}
              </div>
              {insight && (
                <div className="mt-4 rounded-xl bg-amber-50 p-4">
                  <p className="font-semibold">Assisted summary</p>
                  <p className="mt-1 text-sm leading-6">{insight}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Advisory only. Verify against the metrics above.
                  </p>
                </div>
              )}
            </section>
          </>
        )
      )}
    </main>
  );
}
