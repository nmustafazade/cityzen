"use client";
import Link from "next/link";
import { MunicipalityRoute } from "@/components/auth/ProtectedRoute";
const cards=[['Road Conditions','/municipality/infrastructure/roads'],['Parking','/municipality/infrastructure/parking'],['City Facilities','/municipality/infrastructure/facilities']];
export default function Page(){return <MunicipalityRoute><main className="mx-auto max-w-6xl px-6 py-10"><h1 className="text-3xl font-bold">Infrastructure Management</h1><p className="mt-2 text-slate-600">Manage city mobility and public infrastructure resources.</p><div className="mt-8 grid gap-5 sm:grid-cols-3">{cards.map(([t,h])=><Link key={t} href={h} className="rounded-2xl border bg-white p-6 text-lg font-bold shadow-sm hover:border-emerald-300">{t}<span className="mt-4 block text-sm font-semibold text-emerald-700">Manage →</span></Link>)}</div></main></MunicipalityRoute>}
