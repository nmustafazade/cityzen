"use client";
import { useQueryState } from "@/hooks/useQueryState";
import { Pager } from "@/components/content/PublicListShell";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  InfrastructureShell,
  StateMessage,
} from "@/components/infrastructure/InfrastructureShell";
import { getFacilities, getFacilityCategories } from "@/lib/infrastructure";
import type { CityFacility, FacilityCategory } from "@/types/infrastructure";
export default function FacilitiesPage() {
  const [items, setItems] = useState<CityFacility[]>([]),
    [categories, setCategories] = useState<FacilityCategory[]>([]),
    [categoryId, setCategoryId] = useQueryState<string>("categoryId", ""),
    [search, setSearch] = useQueryState<string>("search", ""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [page, setPage] = useQueryState<number>("page", 1);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  useEffect(() => {
    getFacilityCategories()
      .then((r) => setCategories(r.categories))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    let current = true;
    const t = setTimeout(() => {
      setLoading(true);
      getFacilities({
        page,
        limit: 12,
        categoryId: categoryId || undefined,
        search: search || undefined,
      })
        .then((r) => {
          if (!current) return;
          setItems(r.facilities);
          setMeta(r.pagination);
          setError("");
        })
        .catch((e: Error) => {
          if (current) setError(e.message);
        })
        .finally(() => {
          if (current) setLoading(false);
        });
    }, 300);
    return () => {
      current = false;
      clearTimeout(t);
    };
  }, [categoryId, search, page]);
  return (
    <InfrastructureShell
      title="City Facilities"
      subtitle="Find useful public facilities and amenities across the city."
    >
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Search
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or address"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="text-sm font-semibold">
          Category
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loading ? (
        <StateMessage>Loading facilities...</StateMessage>
      ) : error ? (
        <StateMessage>{error}</StateMessage>
      ) : !items.length ? (
        <StateMessage>No matching facilities.</StateMessage>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((x) => (
            <article
              key={x.id}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-bold uppercase text-emerald-700">
                {x.category.icon ? `${x.category.icon} ` : ""}
                {x.category.name}
              </p>
              <h2 className="mt-2 text-lg font-bold">{x.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{x.address}</p>
              {x.openingHours && (
                <p className="mt-3 text-sm">{x.openingHours}</p>
              )}
              <Link
                href={`/facilities/${x.id}`}
                className="mt-5 inline-flex font-semibold text-emerald-700"
              >
                View details →
              </Link>
            </article>
          ))}
        </div>
      )}
      {!loading && !error && <Pager meta={meta} onPage={setPage} />}
    </InfrastructureShell>
  );
}
