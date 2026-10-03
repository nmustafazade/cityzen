"use client";
import { useQueryState } from "@/hooks/useQueryState";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Heart,
  Map,
  MessageCircle,
  Search,
  Users,
} from "lucide-react";
import {
  CardSkeleton,
  EmptyState,
  ErrorState,
} from "@/components/common/States";
import { StatusBadge } from "@/components/reports/ReportBadge";
import { getPublicReports } from "@/lib/community";
import { formatDateTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { getReportCategories } from "@/lib/reports";
import type { PublicReport } from "@/types/community";
import type { ReportCategory, ReportStatus } from "@/types/report";
export default function CommunityPage() {
  const [reports, setReports] = useState<PublicReport[]>([]),
    [categories, setCategories] = useState<ReportCategory[]>([]),
    [search, setSearch] = useQueryState<string>("search", ""),
    [category, setCategory] = useQueryState<string>("categoryId", ""),
    [status, setStatus] = useQueryState<string>("status", ""),
    [sort, setSort] = useQueryState<"newest" | "supported" | "updated">(
      "sort",
      "newest",
    ),
    [page, setPage] = useQueryState<number>("page", 1),
    [pages, setPages] = useState(1),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const requestVersion = useRef(0);
  const invalidateRequest = useCallback(() => {
    requestVersion.current++;
  }, []);
  const load = useCallback(() => {
    const version = ++requestVersion.current;
    setLoading(true);
    return getPublicReports({
      search: search || undefined,
      categoryId: category ? Number(category) : undefined,
      status: (status as ReportStatus) || undefined,
      sort,
      page,
      limit: 12,
    })
      .then((r) => {
        if (version !== requestVersion.current) return;
        setReports(r.reports);
        setPages(r.pagination.totalPages || 1);
        setError("");
      })
      .catch(() => {
        if (version === requestVersion.current)
          setError("We couldn’t load community issues right now.");
      })
      .finally(() => {
        if (version === requestVersion.current) setLoading(false);
      });
  }, [search, category, status, sort, page]);
  useEffect(() => {
    void getReportCategories().then((r) => setCategories(r.categories));
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => {
      clearTimeout(timer);
      invalidateRequest();
    };
  }, [load, invalidateRequest]);
  const featured = [...reports]
    .sort((a, b) => b.upvoteCount - a.upvoteCount)
    .slice(0, 2);
  return (
    <main className="city-page">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#0d2b39] p-8 text-white shadow-xl sm:p-12">
        <div className="absolute -right-10 -top-20 size-72 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-teal-300">
              <Users size={16} />
              Community voices
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              City issues, seen together.
            </h1>
            <p className="mt-4 leading-7 text-slate-300">
              Discover public reports, support shared concerns and follow how
              your city responds.
            </p>
          </div>
          <Link
            href="/community/map"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-extrabold text-slate-950"
          >
            <Map size={18} />
            Explore map
          </Link>
        </div>
      </section>
      <section className="surface-card relative z-10 mx-4 -mt-5 grid gap-3 p-4 md:grid-cols-4">
        <label className="relative">
          <span className="sr-only">Search issues</span>
          <Search className="absolute left-3 top-3 text-slate-400" size={17} />
          <input
            placeholder="Search issues"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full py-2.5 pl-10 pr-3"
          />
        </label>
        <select
          aria-label="Category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All visible statuses</option>
          {[
            "SUBMITTED",
            "UNDER_REVIEW",
            "ASSIGNED",
            "IN_PROGRESS",
            "RESOLVED",
          ].map((x) => (
            <option key={x} value={x}>
              {x.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as typeof sort);
            setPage(1);
          }}
        >
          <option value="newest">Newest</option>
          <option value="supported">Most Supported</option>
          <option value="updated">Recently Updated</option>
        </select>
      </section>
      {error ? (
        <div className="mt-8">
          <ErrorState message={error} onRetry={() => void load()} />
        </div>
      ) : loading ? (
        <div className="mt-8">
          <CardSkeleton />
        </div>
      ) : reports.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No public issues found"
            description="Try changing your search or filters."
          />
        </div>
      ) : (
        <>
          <section className="mt-12">
            <div className="mb-5">
              <p className="city-eyebrow">Community priorities</p>
              <h2 className="mt-1 text-2xl font-extrabold">
                Highly supported issues
              </h2>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {featured.map((report) => (
                <IssueCard key={`f-${report.id}`} report={report} featured />
              ))}
            </div>
          </section>
          <section className="mt-12">
            <h2 className="text-2xl font-extrabold">Recent issues</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {reports.map((report) => (
                <IssueCard key={report.id} report={report} />
              ))}
            </div>
          </section>
          <nav
            aria-label="Issue pagination"
            className="mt-10 flex items-center justify-center gap-4"
          >
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="action-secondary disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm font-bold text-slate-500">
              Page {page} of {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="action-secondary disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        </>
      )}
    </main>
  );
}
function IssueCard({
  report,
  featured = false,
}: {
  report: PublicReport;
  featured?: boolean;
}) {
  const image = report.images[0] && resolveMediaUrl(report.images[0].imageUrl);
  return (
    <article
      className={`surface-card group overflow-hidden ${featured ? "sm:grid sm:grid-cols-[.8fr_1.2fr]" : ""}`}
    >
      <div
        className={`relative bg-gradient-to-br from-teal-100 to-indigo-100 ${featured ? "min-h-52" : "aspect-[16/9]"}`}
      >
        {image ? (
          <Image
            loader={({ src }) => src}
            unoptimized
            fill
            src={image}
            alt={`Photo attached to ${report.title}`}
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <FileFallback />
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700">
            {report.category.name}
          </span>
          <StatusBadge status={report.status} />
        </div>
        <h3
          className={`${featured ? "text-2xl" : "text-xl"} mt-3 font-extrabold tracking-tight`}
        >
          {report.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {report.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1">
            <Heart size={14} />
            {report.upvoteCount} supporters
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={14} />
            {report.commentCount}
          </span>
          <span>{formatDateTime(report.createdAt)}</span>
        </div>
        <Link
          href={`/community/reports/${report.id}`}
          className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-teal-700"
        >
          View issue
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}
function FileFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="text-center">
        <Map className="mx-auto text-teal-700/40" size={40} />
        <p className="mt-2 text-xs font-bold text-teal-900/50">
          Community report
        </p>
      </div>
    </div>
  );
}
