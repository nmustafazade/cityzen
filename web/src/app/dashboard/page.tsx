"use client";

import Link from "next/link";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/user";

const dashboardCards: Record<UserRole, { title: string; description: string; href?: string }[]> = {
  CITIZEN: [
    { title: "My Reports", description: "Track the city issues you have submitted.", href: "/reports" },
    { title: "Report an Issue", description: "Tell your municipality about a local problem.", href: "/reports/new" },
    { title: "City Services", description: "Discover services available in your city.", href: "/services" },
    { title: "My Service Requests", description: "Track your submitted municipal service requests.", href: "/my-services" },
    { title: "Announcements", description: "Read official city and department updates.", href: "/announcements" },
    { title: "Events", description: "Find upcoming activities across the city.", href: "/events" },
    { title: "City Map", description: "Explore roads, parking and public facilities.", href: "/city-map" },
    { title: "Parking", description: "Find spaces and manage reservations.", href: "/parking" },
    { title: "City Facilities", description: "Discover public amenities nearby.", href: "/facilities" },
    { title: "Waste & Recycling", description: "Collection schedules and recycling locations.", href: "/waste" },
    { title: "Environment", description: "Weather and air-quality conditions.", href: "/environment" },
    { title: "City Alerts", description: "Current emergency and safety information.", href: "/alerts" },
  ],
  EMPLOYEE: [
    { title: "Service Requests", description: "Process municipal service requests assigned to you.", href: "/municipality/service-requests" },
    { title: "Assigned Reports", description: "Review issues currently assigned to you." },
    { title: "Report Management", description: "Coordinate and update municipal reports.", href: "/employee/reports" },
    { title: "Department", description: "View your department workspace." },
  ],
  DEPARTMENT_HEAD: [
    { title: "Service Requests", description: "Review and assign requests for your department.", href: "/municipality/service-requests" },
    { title: "Department Reports", description: "Review issues routed to your department.", href: "/employee/reports" },
    { title: "Municipal Services", description: "Manage services published by your department.", href: "/municipality/services" },
    { title: "Announcements", description: "Publish department announcements.", href: "/municipality/announcements" },
    { title: "Events", description: "Publish department events.", href: "/municipality/events" },
    { title: "Assign Reports", description: "Assign department reports to available employees.", href: "/employee/reports" },
    { title: "Infrastructure", description: "Manage department roads, parking and facilities.", href: "/municipality/infrastructure" },
    { title: "Environment & Safety", description: "Manage waste, stations and department alerts.", href: "/municipality/environment" },
  ],
  ADMIN: [
    { title: "Service Requests", description: "Oversee municipal service requests city-wide.", href: "/municipality/service-requests" },
    { title: "Reports", description: "Oversee city issue reporting activity.", href: "/employee/reports" },
    { title: "Users", description: "Manage citizen and municipality accounts." },
    { title: "Departments", description: "Coordinate municipal departments." },
    { title: "Services", description: "Manage city service information.", href: "/municipality/services" },
    { title: "Announcements", description: "Manage citywide and department announcements.", href: "/municipality/announcements" },
    { title: "Events", description: "Manage citywide and department events.", href: "/municipality/events" },
    { title: "Infrastructure", description: "Manage roads, parking and city facilities.", href: "/municipality/infrastructure" },
    { title: "Environment & Safety", description: "Manage waste, monitoring and emergency alerts.", href: "/municipality/environment" },
  ],
};

const roleLabels: Record<UserRole, string> = { CITIZEN: "Citizen", EMPLOYEE: "Employee", DEPARTMENT_HEAD: "Department Head", ADMIN: "Admin" };

function DashboardContent() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:py-14">
      <section className="rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 px-7 py-8 text-white shadow-sm sm:px-10 sm:py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Dashboard</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {user.firstName}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Your Cityzen workspace brings your city services and activity together in one place.</p>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Account</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <ProfileRow label="Full name" value={`${user.firstName} ${user.lastName}`} />
            <ProfileRow label="Email" value={user.email} />
            <ProfileRow label="Role" value={roleLabels[user.role]} />
            {user.department && <ProfileRow label="Department" value={user.department.name} />}
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-950">Your workspace</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {dashboardCards[user.role].map((card, index) => (
              <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">{String(index + 1).padStart(2, "0")}</div>
                <h3 className="mt-5 font-bold text-slate-950">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                {card.href ? (
                  <Link href={card.href} className="mt-5 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                    Open <span aria-hidden="true" className="ml-1">→</span>
                  </Link>
                ) : (
                  <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">Coming soon</p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 font-medium text-slate-900 break-words">{value}</dd></div>;
}

export default function DashboardPage() {
  return <ProtectedRoute><DashboardContent /></ProtectedRoute>;
}
