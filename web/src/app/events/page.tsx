"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import {
  Pager,
  PublicShell,
  State,
  input,
} from "@/components/content/PublicListShell";
import { getEvents } from "@/lib/events";
import { formatDateTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { getPublicDepartments } from "@/lib/management";
import type { PageMeta } from "@/lib/services";
import type { Department } from "@/types/department";
import type { CityEvent } from "@/types/event";
const initial = { page: 1, limit: 10, total: 0, totalPages: 0 };
export default function Events() {
  const [items, setItems] = useState<CityEvent[]>([]),
    [deps, setDeps] = useState<Department[]>([]),
    [dep, setDep] = useState(""),
    [meta, setMeta] = useState<PageMeta>(initial),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const r = await getEvents({
          page,
          limit: 10,
          upcoming: true,
          departmentId: dep ? Number(dep) : undefined,
        });
        setItems(r.events);
        setMeta(r.pagination);
        setError("");
      } catch {
        setError("Unable to load events.");
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
  return (
    <PublicShell
      title="City Events"
      subtitle="Discover activities, public meetings and community experiences happening across the city."
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
      {!loading && !error && (
        <>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((e) => {
              const date = new Date(e.startsAt);
              return (
                <article
                  key={e.id}
                  className="surface-card group overflow-hidden"
                >
                  <div className="relative aspect-[16/9] bg-gradient-to-br from-indigo-100 via-teal-50 to-amber-100">
                    {e.imageUrl ? (
                      <Image
                        loader={({ src }) => src}
                        unoptimized
                        fill
                        src={resolveMediaUrl(e.imageUrl)}
                        alt=""
                        className="object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <CalendarDays
                        className="absolute bottom-5 right-5 text-indigo-600/25"
                        size={70}
                      />
                    )}
                    <div className="absolute left-4 top-4 rounded-xl bg-white px-3 py-2 text-center shadow-lg">
                      <span className="block text-[10px] font-extrabold uppercase text-rose-600">
                        {date.toLocaleString("en", { month: "short" })}
                      </span>
                      <span className="block text-xl font-extrabold">
                        {date.getDate()}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700">
                      {e.department?.name ?? "Citywide"}
                    </p>
                    <h2 className="mt-2 text-xl font-extrabold">{e.title}</h2>
                    <p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                      <CalendarDays size={15} />
                      {formatDateTime(e.startsAt)}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                      <MapPin size={15} />
                      {e.locationName ??
                        e.address ??
                        "Location to be announced"}
                    </p>
                    <Link
                      href={`/events/${e.id}`}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-teal-700"
                    >
                      View event
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
          {items.length > 0 && (
            <Pager meta={meta} onPage={(p) => void load(p)} />
          )}
        </>
      )}
    </PublicShell>
  );
}
