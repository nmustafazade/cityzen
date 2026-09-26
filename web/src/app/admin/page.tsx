"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AdminRoute } from "@/components/auth/ProtectedRoute";
import { ReportError, ReportLoading } from "@/components/reports/ReportStates";
import { useAuth } from "@/context/AuthContext";
import { getAdminStats } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import type { AdminStats } from "@/types/admin";

function AdminDashboardContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve(); setIsLoading(true); setError("");
    try { setStats(await getAdminStats()); }
    catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) { logout(); router.replace("/login"); return; }
      setError(caught instanceof ApiError ? caught.message : "Unable to load administration statistics.");
    } finally { setIsLoading(false); }
  }, [logout, router]);

  useEffect(() => {
    let active = true;
    void getAdminStats().then((value) => { if (active) setStats(value); }).catch((caught: unknown) => {
      if (!active) return;
      if (caught instanceof ApiError && caught.status === 401) { logout(); router.replace("/login"); return; }
      setError(caught instanceof ApiError ? caught.message : "Unable to load administration statistics.");
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [logout, router]);

  if (isLoading) return <AdminShell><ReportLoading message="Loading administration dashboard..." /></AdminShell>;
  if (error || !stats) return <AdminShell><ReportError message={error || "Statistics unavailable."} onRetry={() => void load()} /></AdminShell>;

  const openReports = stats.reports.submitted + stats.reports.inProgress;
  const cards = [
    ["Total Users", stats.users.total, "/admin/users"],
    ["Citizens", stats.users.citizens, "/admin/users?role=CITIZEN"],
    ["Employees", stats.users.employees, "/admin/users?role=EMPLOYEE"],
    ["Total Reports", stats.reports.total, "/employee/reports"],
    ["Open Reports", openReports, "/employee/reports"],
    ["Resolved Reports", stats.reports.resolved, "/employee/reports?status=RESOLVED"],
    ["Departments", stats.departments.total, "/admin/departments"],
    ["Categories", stats.categories.total, "/admin/categories"],
  ] as const;

  return <AdminShell><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Administration</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Admin Dashboard</h1><p className="mt-3 text-slate-600">Manage Cityzen users, municipality structure, and reporting configuration.</p></div><section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value, href]) => <Link key={label} href={href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold text-slate-950">{value}</p><p className="mt-4 text-sm font-semibold text-emerald-700">View details →</p></Link>)}</section></AdminShell>;
}

function AdminShell({ children }: { children: React.ReactNode }) { return <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 sm:py-14">{children}</main>; }
export default function AdminPage() { return <AdminRoute><AdminDashboardContent /></AdminRoute>; }
