"use client";

import Link from "next/link";

import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <main className="relative flex min-h-[calc(100vh-65px)] items-center overflow-hidden bg-slate-50 px-6 py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_40%)]" />
      <section className="relative mx-auto w-full max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">A more connected city</p>
          <h1 className="mt-5 text-5xl font-bold tracking-[-0.04em] text-slate-950 sm:text-7xl">Cityzen</h1>
          <p className="mt-5 text-xl font-medium text-slate-700 sm:text-2xl">Smart City Citizen &amp; Municipality Platform</p>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Report city problems, follow their progress, and stay connected with municipal services.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            {!isLoading && (isAuthenticated ? (
              <Link href="/dashboard" className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">Go to Dashboard</Link>
            ) : (
              <>
                <Link href="/register" className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">Get Started</Link>
                <Link href="/login" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">Login</Link>
              </>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
