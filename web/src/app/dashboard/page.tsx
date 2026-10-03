"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  Building2,
  CircleParking,
  ClipboardList,
  CloudSun,
  FilePlus2,
  FileText,
  Gauge,
  Map,
  MapPinned,
  Megaphone,
  ShieldAlert,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CardSkeleton, SectionHeader } from "@/components/common/States";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { getMyReports, getReports } from "@/lib/reports";
import {
  getManagedServiceRequests,
  getMyServiceRequests,
} from "@/lib/service-requests";
import { getMyParkingReservations } from "@/lib/infrastructure";
import { getAnnouncements } from "@/lib/announcements";
import { getEvents } from "@/lib/events";
import { getAlerts } from "@/lib/emergency";
import { getAnalyticsOverview } from "@/lib/analytics";
import { formatDateTime, roleLabels } from "@/lib/format";
type Metric = {
  label: string;
  value: number | string;
  href: string;
  icon: typeof FileText;
  tone: string;
};
type Update = {
  kind: string;
  title: string;
  detail: string;
  href: string;
  date?: string;
};
const quickCitizen = [
  {
    label: "Report Issue",
    text: "Tell the city what needs attention",
    href: "/reports/new",
    icon: FilePlus2,
    tone: "bg-teal-400 text-slate-950",
  },
  {
    label: "Request Service",
    text: "Access municipality services online",
    href: "/services",
    icon: Building2,
    tone: "bg-[#0d2b39] text-white",
  },
  {
    label: "Open City Map",
    text: "Explore infrastructure and conditions",
    href: "/city-map",
    icon: Map,
    tone: "bg-indigo-600 text-white",
  },
  {
    label: "Find Parking",
    text: "View parking and availability",
    href: "/parking",
    icon: CircleParking,
    tone: "bg-amber-300 text-slate-950",
  },
];
function CitizenDashboard({ firstName }: { firstName: string }) {
  const { unreadCount } = useNotifications(),
    [metrics, setMetrics] = useState<Metric[]>([]),
    [updates, setUpdates] = useState<Update[]>([]),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      getMyReports({ limit: 100 }),
      getMyServiceRequests({ limit: 100 }),
      getMyParkingReservations(),
      getAnnouncements({ limit: 2 }),
      getEvents({ limit: 2 }),
      getAlerts(),
    ]).then((results) => {
      if (!alive) return;
      const reports =
          results[0].status === "fulfilled" ? results[0].value.reports : [],
        requests =
          results[1].status === "fulfilled" ? results[1].value.requests : [],
        reservations =
          results[2].status === "fulfilled"
            ? results[2].value.reservations
            : [],
        announcements =
          results[3].status === "fulfilled"
            ? results[3].value.announcements
            : [],
        events =
          results[4].status === "fulfilled" ? results[4].value.events : [],
        alerts =
          results[5].status === "fulfilled" ? results[5].value.alerts : [];
      setMetrics([
        {
          label: "Open reports",
          value: reports.filter(
            (x) => !["RESOLVED", "REJECTED", "CANCELLED"].includes(x.status),
          ).length,
          href: "/reports",
          icon: FileText,
          tone: "text-teal-700 bg-teal-50",
        },
        {
          label: "Active requests",
          value: requests.filter(
            (x) => !["COMPLETED", "REJECTED", "CANCELLED"].includes(x.status),
          ).length,
          href: "/my-services",
          icon: ClipboardList,
          tone: "text-indigo-700 bg-indigo-50",
        },
        {
          label: "Parking reservations",
          value: reservations.length,
          href: "/my-parking",
          icon: CircleParking,
          tone: "text-amber-700 bg-amber-50",
        },
        {
          label: "Unread updates",
          value: unreadCount,
          href: "/notifications",
          icon: Bell,
          tone: "text-rose-700 bg-rose-50",
        },
      ]);
      setUpdates(
        [
          ...alerts.slice(0, 1).map((x) => ({
            kind: "City alert",
            title: x.title,
            detail: x.message,
            href: `/alerts/${x.id}`,
            date: x.createdAt,
          })),
          ...announcements.map((x) => ({
            kind: "Announcement",
            title: x.title,
            detail: x.summary || x.content,
            href: `/announcements/${x.id}`,
            date: x.publishedAt ?? x.createdAt,
          })),
          ...events.map((x) => ({
            kind: "Upcoming event",
            title: x.title,
            detail: x.location || "City event",
            href: `/events/${x.id}`,
            date: x.startsAt,
          })),
        ].slice(0, 4),
      );
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [unreadCount]);
  return (
    <>
      <Welcome
        firstName={firstName}
        context="Here’s what is happening across your Cityzen account and your city today."
      />
      <section className="mt-8">
        <SectionHeader
          title="Quick actions"
          subtitle="Your most-used city services"
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickCitizen.map(({ icon: Icon, ...item }) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group rounded-2xl p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${item.tone}`}
            >
              <Icon size={25} />
              <h3 className="mt-8 text-lg font-extrabold">{item.label}</h3>
              <p className="mt-1 text-sm opacity-75">{item.text}</p>
              <ArrowRight
                className="mt-5 transition group-hover:translate-x-1"
                size={18}
              />
            </Link>
          ))}
        </div>
      </section>
      {loading ? (
        <div className="mt-8">
          <CardSkeleton count={4} />
        </div>
      ) : (
        <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
          <div>
            <SectionHeader
              title="My activity"
              subtitle="Live counts from your account"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {metrics.map(({ icon: Icon, ...m }) => (
                <Link
                  key={m.label}
                  href={m.href}
                  className="surface-card flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <span
                    className={`grid size-12 place-items-center rounded-2xl ${m.tone}`}
                  >
                    <Icon size={21} />
                  </span>
                  <div>
                    <p className="text-2xl font-extrabold">{m.value}</p>
                    <p className="text-xs font-bold text-slate-500">
                      {m.label}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl bg-[#0d2b39] p-7 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-300">
                    City snapshot
                  </p>
                  <h3 className="mt-2 text-2xl font-extrabold">
                    Your city at a glance
                  </h3>
                </div>
                <CloudSun className="text-amber-300" />
              </div>
              <div className="mt-7 grid grid-cols-3 gap-3 text-center">
                <Link href="/environment" className="rounded-xl bg-white/8 p-3">
                  <CloudSun className="mx-auto" size={19} />
                  <span className="mt-2 block text-xs">Environment</span>
                </Link>
                <Link href="/roads" className="rounded-xl bg-white/8 p-3">
                  <Wrench className="mx-auto" size={19} />
                  <span className="mt-2 block text-xs">Roads</span>
                </Link>
                <Link href="/facilities" className="rounded-xl bg-white/8 p-3">
                  <MapPinned className="mx-auto" size={19} />
                  <span className="mt-2 block text-xs">Facilities</span>
                </Link>
              </div>
            </div>
          </div>
          <div>
            <SectionHeader
              title="City updates"
              subtitle="Official information that matters"
              action={
                <Link
                  href="/announcements"
                  className="text-sm font-bold text-teal-700"
                >
                  View all
                </Link>
              }
            />
            <div className="surface-card overflow-hidden">
              {updates.length ? (
                updates.map((item, index) => (
                  <Link
                    href={item.href}
                    key={`${item.kind}-${index}`}
                    className="block border-b border-slate-100 p-5 last:border-0 hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700">
                        {item.kind}
                      </span>
                      {item.date && (
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(item.date)}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-extrabold">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                      {item.detail}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="p-8 text-center text-sm text-slate-500">
                  No city updates are available right now.
                </p>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
function StaffDashboard() {
  const { user } = useAuth(),
    [metrics, setMetrics] = useState<Metric[]>([]),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    const to = new Date(),
      from = new Date(to.getTime() - 30 * 86400000),
      analytics =
        user.role === "ADMIN" || user.role === "DEPARTMENT_HEAD"
          ? getAnalyticsOverview({
              from: from.toISOString(),
              to: to.toISOString(),
            })
          : Promise.resolve(null);
    Promise.allSettled([
      getReports({ limit: 100 }),
      getManagedServiceRequests({ limit: 100 }),
      analytics,
    ]).then(([r, s, a]) => {
      const reports = r.status === "fulfilled" ? r.value.reports : [],
        requests = s.status === "fulfilled" ? s.value.requests : [],
        overview = a.status === "fulfilled" ? a.value : null;
      setMetrics([
        {
          label: "Open reports",
          value:
            overview?.reports.open ??
            reports.filter(
              (x) => !["RESOLVED", "REJECTED", "CANCELLED"].includes(x.status),
            ).length,
          href: "/employee/reports",
          icon: FileText,
          tone: "bg-teal-50 text-teal-700",
        },
        {
          label: "Service requests",
          value:
            overview?.serviceRequests.open ??
            requests.filter(
              (x) => !["COMPLETED", "REJECTED", "CANCELLED"].includes(x.status),
            ).length,
          href: "/municipality/service-requests",
          icon: ClipboardList,
          tone: "bg-indigo-50 text-indigo-700",
        },
        {
          label: "Unassigned work",
          value:
            reports.filter((x) => !x.assignedEmployee).length +
            requests.filter((x) => !x.assignedEmployee).length,
          href: "/employee/reports",
          icon: Users,
          tone: "bg-amber-50 text-amber-700",
        },
        {
          label: "Citizen rating",
          value: overview?.citizenFeedback.averageRating ?? "—",
          href: "/municipality/analytics",
          icon: Sparkles,
          tone: "bg-rose-50 text-rose-700",
        },
      ]);
      setLoading(false);
    });
  }, [user]);
  if (!user) return null;
  const links =
    user.role === "ADMIN"
      ? [
          { label: "City Analytics", href: "/admin/analytics", icon: Gauge },
          { label: "Manage Users", href: "/admin/users", icon: Users },
          { label: "Departments", href: "/admin/departments", icon: Building2 },
          {
            label: "Emergency Alerts",
            href: "/municipality/emergency-alerts",
            icon: ShieldAlert,
          },
        ]
      : [
          {
            label: "Full Analytics",
            href: "/municipality/analytics",
            icon: Gauge,
          },
          {
            label: "Department Reports",
            href: "/employee/reports",
            icon: FileText,
          },
          {
            label: "Service Requests",
            href: "/municipality/service-requests",
            icon: ClipboardList,
          },
          {
            label: "Publish Update",
            href: "/municipality/announcements",
            icon: Megaphone,
          },
        ];
  return (
    <>
      <Welcome
        firstName={user.firstName}
        context={`${roleLabels[user.role]} operations center${user.department ? ` · ${user.department.name}` : ""}.`}
      />
      {loading ? (
        <div className="mt-8">
          <CardSkeleton count={4} />
        </div>
      ) : (
        <>
          <section className="mt-8">
            <SectionHeader
              title={
                user.role === "ADMIN" ? "City overview" : "Department workload"
              }
              subtitle="Current operational priorities"
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map(({ icon: Icon, ...m }) => (
                <Link
                  key={m.label}
                  href={m.href}
                  className="surface-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`grid size-11 place-items-center rounded-xl ${m.tone}`}
                    >
                      <Icon size={20} />
                    </span>
                    <ArrowRight size={16} className="text-slate-300" />
                  </div>
                  <p className="mt-7 text-3xl font-extrabold">{m.value}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {m.label}
                  </p>
                </Link>
              ))}
            </div>
          </section>
          <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-2xl bg-[#0d2b39] p-7 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-300">
                    Operations
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold">
                    Work requiring attention
                  </h2>
                </div>
                <Wrench className="text-teal-300" />
              </div>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {metrics.slice(0, 2).map((m) => (
                  <Link
                    key={m.label}
                    href={m.href}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
                  >
                    <p className="text-2xl font-extrabold">{m.value}</p>
                    <p className="text-sm text-slate-300">{m.label}</p>
                  </Link>
                ))}
              </div>
              <Link
                href="/employee/reports"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-teal-300"
              >
                Open work queue
                <ArrowRight size={16} />
              </Link>
            </div>
            <div>
              <SectionHeader title="Workspace shortcuts" />
              <div className="surface-card divide-y divide-slate-100">
                {links.map(({ icon: Icon, ...x }) => (
                  <Link
                    key={x.href}
                    href={x.href}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50"
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-700">
                      <Icon size={17} />
                    </span>
                    <span className="text-sm font-bold">{x.label}</span>
                    <ArrowRight size={15} className="ml-auto text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
function Welcome({
  firstName,
  context,
}: {
  firstName: string;
  context: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-[#071d2b] px-7 py-9 text-white shadow-xl sm:px-10">
      <div className="absolute -right-16 -top-20 size-72 rounded-full bg-teal-400/15 blur-3xl" />
      <div className="relative">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-teal-300">
          Your city workspace
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          {context}
        </p>
      </div>
    </section>
  );
}
function Content() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <main className="city-page">
      {user.role === "CITIZEN" ? (
        <CitizenDashboard firstName={user.firstName} />
      ) : (
        <StaffDashboard />
      )}
    </main>
  );
}
export default function Page() {
  return (
    <ProtectedRoute>
      <Content />
    </ProtectedRoute>
  );
}
