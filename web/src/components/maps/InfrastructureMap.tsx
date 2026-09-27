"use client";

import dynamic from "next/dynamic";

export interface InfrastructureMarker { id: string; latitude: number; longitude: number; title: string; detail: string; href: string; kind: "road" | "parking" | "facility"; }
const Canvas = dynamic(() => import("./InfrastructureMapCanvas"), { ssr: false, loading: () => <div className="flex h-[430px] items-center justify-center bg-slate-100 text-sm text-slate-500">Loading city map...</div> });
export function InfrastructureMap({ markers, center }: { markers: InfrastructureMarker[]; center?: [number, number] }) { return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"><Canvas markers={markers} center={center} /></div>; }
