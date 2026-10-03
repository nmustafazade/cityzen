"use client";
import { useQueryState, useQueryDraft } from "@/hooks/useQueryState";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  FileCheck2,
  Search,
  Sparkles,
} from "lucide-react";
import {
  Pager,
  PublicShell,
  State,
  input,
} from "@/components/content/PublicListShell";
import { getPublicDepartments } from "@/lib/management";
import { getServices, type PageMeta } from "@/lib/services";
import type { Department } from "@/types/department";
import type { MunicipalService } from "@/types/service";
const initial = { page: 1, limit: 12, total: 0, totalPages: 0 };
export default function ServicesPage() {
  const [items, setItems] = useState<MunicipalService[]>([]),
    [departments, setDepartments] = useState<Department[]>([]),
    [departmentId, setDepartmentId] = useQueryState<string>("departmentId", ""),
    [search, setSearch] = useQueryState<string>("search", ""),
    [meta, setMeta] = useState<PageMeta>(initial),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [searchInput, setSearchInput] = useQueryDraft(search);
  const [page, setPage] = useQueryState<number>("page", 1);
  const requestVersion = useRef(0);
  const invalidateRequest = useCallback(() => {
    requestVersion.current++;
  }, []);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError("");
    try {
      const result = await getServices({
        page,
        limit: 12,
        departmentId: departmentId ? Number(departmentId) : undefined,
        search: search || undefined,
      });
      if (version !== requestVersion.current) return;
      setItems(result.services);
      setMeta(result.pagination);
    } catch {
      if (version === requestVersion.current)
        setError("Unable to load city services.");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [departmentId, search, page]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    void getPublicDepartments().then((r) => setDepartments(r.departments));
    return () => {
      clearTimeout(timer);
      invalidateRequest();
    };
  }, [load, invalidateRequest]);
  function submit(e: FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }
  return (
    <PublicShell
      title="City Services"
      subtitle="Find and request municipal services without navigating city offices or separate systems."
    >
      <section className="mt-8 overflow-hidden rounded-[1.75rem] bg-[#0d2b39] p-7 text-white sm:p-9">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-teal-300">
              <Sparkles size={15} />
              Digital municipality
            </p>
            <h2 className="mt-3 text-2xl font-extrabold">
              What can the city help you with?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Search by need or browse services from each department.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-white/8 px-4 py-3">
              <FileCheck2 className="mx-auto text-teal-300" size={20} />
              <p className="mt-1 text-xs font-bold">Track requests</p>
            </div>
            <div className="rounded-xl bg-white/8 px-4 py-3">
              <CalendarCheck className="mx-auto text-amber-300" size={20} />
              <p className="mt-1 text-xs font-bold">Book appointments</p>
            </div>
          </div>
        </div>
      </section>
      <form
        onSubmit={submit}
        className="surface-card relative z-10 mx-4 -mt-5 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]"
      >
        <label className="relative">
          <span className="sr-only">Search services</span>
          <Search className="absolute left-3 top-3 text-slate-400" size={17} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="What service do you need?"
            className={`${input} w-full pl-10`}
          />
        </label>
        <select
          aria-label="Filter by department"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className={input}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button className="action-primary">Search</button>
      </form>
      <State
        loading={loading}
        error={error}
        empty={!items.length}
        retry={() => void load()}
      />
      {!loading && !error && items.length > 0 && (
        <>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((service, index) => (
              <article
                key={service.id}
                className="surface-card group overflow-hidden"
              >
                <div
                  className={`relative h-28 ${["bg-teal-700", "bg-indigo-700", "bg-amber-500", "bg-rose-700"][index % 4]}`}
                >
                  <Building2
                    className="absolute bottom-4 right-5 text-white/25"
                    size={64}
                  />
                  <span className="absolute left-5 top-5 rounded-lg bg-white/15 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-white backdrop-blur">
                    {service.department.name}
                  </span>
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-extrabold tracking-tight">
                    {service.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                    {service.description}
                  </p>
                  {service.address && (
                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      Available at {service.address}
                    </p>
                  )}
                  <Link
                    href={`/services/${service.id}`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-teal-700"
                  >
                    View service
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <Pager meta={meta} onPage={setPage} />
        </>
      )}
    </PublicShell>
  );
}
