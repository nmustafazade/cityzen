"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/context/AuthContext";

function LoadingScreen({ message }: { message: string }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <span className="size-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        {message}
      </div>
    </main>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <LoadingScreen message="Checking your account..." />;
  }

  return children;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return <LoadingScreen message="Loading Cityzen..." />;
  }

  return children;
}

export function CitizenRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      {user?.role === "CITIZEN" ? (
        children
      ) : (
        <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-6 text-center">
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-950">Citizen reports</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This area is currently available to citizen accounts. Employee and admin report management will be added later.
            </p>
            <Link href="/dashboard" className="mt-6 inline-flex rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
              Return to Dashboard
            </Link>
          </section>
        </main>
      )}
    </ProtectedRoute>
  );
}

export function StaffRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isStaff = user?.role === "EMPLOYEE" || user?.role === "ADMIN";

  return (
    <ProtectedRoute>
      {isStaff ? (
        children
      ) : (
        <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-6 text-center">
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-950">Access denied</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Report management is available to municipality employee and administrator accounts.
            </p>
            <Link href="/dashboard" className="mt-6 inline-flex rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
              Return to Dashboard
            </Link>
          </section>
        </main>
      )}
    </ProtectedRoute>
  );
}
