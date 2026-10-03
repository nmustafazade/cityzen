"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Megaphone } from "lucide-react";
import {
  Pager,
  PublicShell,
  State,
  input,
} from "@/components/content/PublicListShell";
import { getAnnouncements } from "@/lib/announcements";
import { formatDateTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { getPublicDepartments } from "@/lib/management";
import type { PageMeta } from "@/lib/services";
import type { Announcement } from "@/types/announcement";
import type { Department } from "@/types/department";
const initial = { page: 1, limit: 10, total: 0, totalPages: 0 };
export default function Announcements() {
  const [items, setItems] = useState<Announcement[]>([]),
    [deps, setDeps] = useState<Department[]>([]),
    [dep, setDep] = useState(""),
    [meta, setMeta] = useState<PageMeta>(initial),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const r = await getAnnouncements({
          page,
          limit: 10,
          departmentId: dep ? Number(dep) : undefined,
        });
        setItems(r.announcements);
        setMeta(r.pagination);
        setError("");
      } catch {
        setError("Unable to load announcements.");
      } finally {
        setLoading(false);
      }
    },
    [dep],
  );
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    void getPublicDepartments().then((r) => setDeps(r.departments));
    return () => clearTimeout(t);
  }, [load]);
  const featured = items[0];
  return (
    <PublicShell
      title="City Announcements"
      subtitle="Official updates, decisions and useful information from your city and municipal departments."
    >
      <div className="mt-8 flex justify-end">
        <select
          aria-label="Filter by department"
          value={dep}
          onChange={(e) => setDep(e.target.value)}
          className={input}
        >
          <option value="">All departments and citywide</option>
          {deps.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <State
        loading={loading}
        error={error}
        empty={!items.length}
        retry={() => void load(meta.page)}
      />
      {!loading && !error && featured && (
        <>
          <article className="mt-8 overflow-hidden rounded-[1.75rem] bg-[#0d2b39] text-white shadow-xl">
            <div className="grid md:grid-cols-[1.1fr_.9fr]">
              <div className="p-8 sm:p-10">
                <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-teal-300">
                  <Megaphone size={15} />
                  Featured announcement
                </p>
                <h2 className="mt-5 text-3xl font-extrabold tracking-tight">
                  {featured.title}
                </h2>
                <p className="mt-4 line-clamp-4 leading-7 text-slate-300">
                  {featured.content}
                </p>
                <p className="mt-5 text-xs text-slate-400">
                  {featured.department?.name ?? "Citywide"}
                  {featured.publishedAt
                    ? ` · ${formatDateTime(featured.publishedAt)}`
                    : ""}
                </p>
                <Link
                  href={`/announcements/${featured.id}`}
                  className="mt-7 inline-flex items-center gap-2 font-extrabold text-teal-300"
                >
                  Read announcement
                  <ArrowRight size={17} />
                </Link>
              </div>
              <div className="relative min-h-64 bg-[radial-gradient(circle_at_top_right,#2dd4bf55,transparent_60%)]">
                {featured.imageUrl && (
                  <Image
                    loader={({ src }) => src}
                    unoptimized
                    fill
                    src={resolveMediaUrl(featured.imageUrl)}
                    alt=""
                    className="object-cover"
                  />
                )}
              </div>
            </div>
          </article>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {items.slice(1).map((a) => (
              <article
                key={a.id}
                className="surface-card group overflow-hidden"
              >
                <div className="relative h-36 bg-gradient-to-br from-teal-100 to-slate-200">
                  {a.imageUrl ? (
                    <Image
                      loader={({ src }) => src}
                      unoptimized
                      fill
                      src={resolveMediaUrl(a.imageUrl)}
                      alt=""
                      className="object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <Megaphone
                      className="absolute bottom-5 right-5 text-teal-700/30"
                      size={58}
                    />
                  )}
                </div>
                <div className="p-6">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700">
                    {a.department?.name ?? "Citywide"}
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold">{a.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {a.content}
                  </p>
                  <Link
                    href={`/announcements/${a.id}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-teal-700"
                  >
                    Read more
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {items.length > 0 && (
            <Pager meta={meta} onPage={(p) => void load(p)} />
          )}
        </>
      )}
    </PublicShell>
  );
}
