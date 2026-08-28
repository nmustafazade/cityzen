"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/user";

const roleLabels: Record<UserRole, string> = {
  CITIZEN: "Citizen",
  EMPLOYEE: "Employee",
  ADMIN: "Admin",
};

export function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

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
          <Link href="/" className="hidden text-sm font-medium text-slate-600 hover:text-emerald-700 sm:block">
            Home
          </Link>
        </div>

        {!isLoading && (
          <div className="flex items-center gap-3 sm:gap-5">
            {isAuthenticated && user ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-slate-700 hover:text-emerald-700">
                  Dashboard
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
      </nav>
    </header>
  );
}
