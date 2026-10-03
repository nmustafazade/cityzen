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
import {
  ArrowRight,
  Building2,
  FileText,
  FolderCog,
  Gauge,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

function AdminDashboardContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    setError("");
    try {
      setStats(await getAdminStats());
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Unable to load administration statistics.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [logout, router]);

  useEffect(() => {
    let active = true;
    void getAdminStats()
      .then((value) => {
        if (active) setStats(value);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        if (caught instanceof ApiError && caught.status === 401) {
          logout();
          router.replace("/login");
          return;
        }
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Unable to load administration statistics.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [logout, router]);

  if (isLoading)
    return (
      <AdminShell>
        <ReportLoading message="Loading administration dashboard..." />
      </AdminShell>
    );
  if (error || !stats)
    return (
      <AdminShell>
        <ReportError
          message={error || "Statistics unavailable."}
          onRetry={() => void load()}
        />
      </AdminShell>
    );

  const openReports = stats.reports.submitted + stats.reports.inProgress;
  const cards = [
    ["Total Users", stats.users.total, "/admin/users"],
    ["Citizens", stats.users.citizens, "/admin/users?role=CITIZEN"],
    ["Employees", stats.users.employees, "/admin/users?role=EMPLOYEE"],
    ["Total Reports", stats.reports.total, "/employee/reports"],
    ["Open Reports", openReports, "/employee/reports"],
    [
      "Resolved Reports",
      stats.reports.resolved,
      "/employee/reports?status=RESOLVED",
    ],
    ["Departments", stats.departments.total, "/admin/departments"],
    ["Categories", stats.categories.total, "/admin/categories"],
  ] as const;

  const icons = [
    Users,
    Users,
    ShieldCheck,
    FileText,
    FileText,
    FileText,
    Building2,
    FolderCog,
  ];
  return (
    <AdminShell>
      <PageHeader
        eyebrow="City administration"
        title="City Operations Overview"
        subtitle="Monitor the platform city-wide and move quickly into the areas that need attention."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, href], index) => {
          const Icon = icons[index];
          return (
            <Link
              key={label}
              href={href}
              className={`group relative overflow-hidden rounded-2xl p-6 transition hover:-translate-y-1 hover:shadow-xl ${index === 0 ? "bg-[#0d2b39] text-white" : "surface-card"}`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`grid size-11 place-items-center rounded-xl ${index === 0 ? "bg-teal-400 text-slate-950" : "bg-teal-50 text-teal-700"}`}
                >
                  <Icon size={20} />
                </span>
                <ArrowRight
                  size={16}
                  className={index === 0 ? "text-slate-400" : "text-slate-300"}
                />
              </div>
              <p
                className={`mt-7 text-xs font-bold ${index === 0 ? "text-slate-300" : "text-slate-500"}`}
              >
                {label}
              </p>
              <p className="mt-1 text-3xl font-extrabold">{value}</p>
            </Link>
          );
        })}
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 p-8 text-white">
          <Gauge className="text-teal-200" />
          <h2 className="mt-8 text-2xl font-extrabold">City analytics</h2>
          <p className="mt-3 max-w-xl leading-7 text-teal-100">
            Review report demand, municipal service performance, workload and
            citizen feedback across every department.
          </p>
          <Link
            href="/admin/analytics"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-teal-800"
          >
            Open analytics
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="surface-card p-6">
          <h2 className="text-lg font-extrabold">Management areas</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {[
              ["Services", "/municipality/services"],
              ["Announcements", "/municipality/announcements"],
              ["Events", "/municipality/events"],
              ["Infrastructure", "/municipality/infrastructure"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="flex items-center py-3.5 text-sm font-bold text-slate-700 hover:text-teal-700"
              >
                {label}
                <ArrowRight size={15} className="ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return <main className="city-page">{children}</main>;
}
export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminDashboardContent />
    </AdminRoute>
  );
}
