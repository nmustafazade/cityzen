"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import type { UserRole } from "@/types/user";

const roleLabels: Record<UserRole, string> = {
  CITIZEN: "Citizen",
  EMPLOYEE: "Employee",
  DEPARTMENT_HEAD: "Department Head",
  ADMIN: "Admin",
};

export function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { unreadCount } = useNotifications();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-950">
            <span className="text-emerald-600">City</span>zen
          </Link>
          <div className="hidden items-center gap-5 md:flex"><Link href="/" className="text-sm font-medium text-slate-600 hover:text-emerald-700">Home</Link><Link href="/services" className="text-sm font-medium text-slate-600 hover:text-emerald-700">Services</Link><Link href="/city-map" className="text-sm font-medium text-slate-600 hover:text-emerald-700">Explore</Link><Link href="/announcements" className="hidden text-sm font-medium text-slate-600 hover:text-emerald-700 xl:block">Announcements</Link><Link href="/events" className="hidden text-sm font-medium text-slate-600 hover:text-emerald-700 xl:block">Events</Link></div>
        </div>

        {!isLoading && (
          <div className="flex items-center gap-3 sm:gap-5">
            {isAuthenticated && user ? (
              <>
                <Link href={user.role === "ADMIN" ? "/admin" : "/dashboard"} className="text-sm font-medium text-slate-700 hover:text-emerald-700">
                  Dashboard
                </Link>
                {user.role === "CITIZEN" && (
                  <>
                    <Link href="/reports" className="hidden text-sm font-medium text-slate-700 hover:text-emerald-700 md:block">
                      My Reports
                    </Link>
                    <Link href="/reports/new" className="hidden text-sm font-medium text-slate-700 hover:text-emerald-700 lg:block">
                      Report an Issue
                    </Link>
                    <Link href="/my-services" className="hidden text-sm font-medium text-slate-700 hover:text-emerald-700 xl:block">
                      My Service Requests
                    </Link>
                    <Link href="/my-parking" className="hidden text-sm font-medium text-slate-700 hover:text-emerald-700 xl:block">My Parking</Link>
                  </>
                )}
                {(user.role === "EMPLOYEE" || user.role === "DEPARTMENT_HEAD" || user.role === "ADMIN") && (
                  <><Link href="/employee/reports" className="text-sm font-medium text-slate-700 hover:text-emerald-700">Reports</Link><Link href="/municipality/service-requests" className="hidden text-sm font-medium text-slate-700 hover:text-emerald-700 lg:block">Service Requests</Link></>
                )}
                {(user.role === "DEPARTMENT_HEAD" || user.role === "ADMIN") && <><Link href="/municipality/services" className="hidden text-sm font-medium text-slate-700 hover:text-emerald-700 lg:block">Publishing</Link><Link href="/municipality/infrastructure" className="hidden text-sm font-medium text-slate-700 hover:text-emerald-700 xl:block">Infrastructure</Link></>}
                {user.role === "ADMIN" && (
                  <>
                    <Link href="/admin/users" className="hidden text-sm font-medium text-slate-700 hover:text-emerald-700 lg:block">Users</Link>
                    <Link href="/admin/departments" className="hidden text-sm font-medium text-slate-700 hover:text-emerald-700 xl:block">Departments</Link>
                    <Link href="/admin/categories" className="hidden text-sm font-medium text-slate-700 hover:text-emerald-700 xl:block">Categories</Link>
                  </>
                )}
                <Link
                  href="/notifications"
                  aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
                  className="relative inline-flex size-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.9 18H9.1m9.15-2.4A2 2 0 0 1 16.4 14.4V10a4.4 4.4 0 1 0-8.8 0v4.4a2 2 0 0 1-1.85 1.2h12.5ZM13.5 19.5a1.6 1.6 0 0 1-3 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-rose-600 px-1 text-center text-[11px] font-bold leading-5 text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
                <div className="hidden border-l border-slate-200 pl-5 text-right sm:block">
                  <p className="text-sm font-semibold text-slate-900">{user.firstName}</p>
                  <p className="text-xs text-slate-500">{roleLabels[user.role]}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-emerald-700">
                  Login
                </Link>
                <Link href="/register" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                  Register
                </Link>
              </>
            )}
          </div>
        )}
        <div className="flex w-full flex-wrap items-center justify-center gap-5 border-t border-slate-100 pt-3 text-sm font-medium text-slate-600 md:hidden"><Link href="/services">Services</Link><Link href="/city-map">Explore</Link>{user?.role === "CITIZEN" && <Link href="/my-services">My Requests</Link>}{user && user.role !== "CITIZEN" && <Link href="/municipality/service-requests">Service Requests</Link>}<Link href="/announcements">Announcements</Link><Link href="/events">Events</Link></div>
      </nav>
    </header>
  );
}
