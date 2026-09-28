"use client";
import dynamic from "next/dynamic";
import type { PublicReport } from "@/types/community";
const Canvas=dynamic(()=>import("./CommunityReportMapCanvas"),{ssr:false,loading:()=> <div className="flex h-[560px] items-center justify-center bg-slate-100">Loading map...</div>});
export function CommunityReportMap({reports}:{reports:PublicReport[]}){return <div className="overflow-hidden rounded-2xl border"><Canvas reports={reports}/></div>}
