"use client";
import type { ReactNode } from "react";
import type { PageMeta } from "@/lib/services";
import { PageHeader } from "@/components/common/PageHeader";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/common/States";
export const card="surface-card p-6";
export const input="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100";
export function PublicShell({title,subtitle,children}:{title:string;subtitle:string;children:ReactNode}){return <main className="city-page"><PageHeader eyebrow="Discover your city" title={title} subtitle={subtitle}/>{children}</main>}
export function Pager({meta,onPage}:{meta:PageMeta;onPage:(page:number)=>void}){const pages=Math.max(1,meta.totalPages);return <nav aria-label="Pagination" className="mt-8 flex items-center justify-between"><button disabled={meta.page<=1} onClick={()=>onPage(meta.page-1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Previous</button><span className="text-sm text-slate-600">Page {meta.page} of {pages}</span><button disabled={meta.page>=pages} onClick={()=>onPage(meta.page+1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Next</button></nav>}
export function State({loading,error,empty,retry}:{loading:boolean;error:string;empty:boolean;retry:()=>void}){if(loading)return <div className="mt-8"><CardSkeleton/></div>;if(error)return <div className="mt-8"><ErrorState message={error} onRetry={retry}/></div>;if(empty)return <div className="mt-8"><EmptyState/></div>;return null}
