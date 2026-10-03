"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ContentCoverImage } from "@/components/content/ContentCoverImage";
import { PublicShell, card } from "@/components/content/PublicListShell";
import { getService } from "@/lib/services";
import { useAuth } from "@/context/AuthContext";
import type { MunicipalService } from "@/types/service";

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [item, setItem] = useState<MunicipalService | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void getService(Number(id))
      .then((response) => setItem(response.service))
      .catch(() => setError("Service not found."));
  }, [id]);
  return (
    <PublicShell
      title={item?.title ?? "City Service"}
      subtitle={item?.department.name ?? "Municipal service information"}
    >
      <Link
        href="/services"
        className="mt-6 inline-flex font-semibold text-emerald-700"
      >
        ← Back to Services
      </Link>
      {error ? (
        <p className="mt-8 text-red-700">{error}</p>
      ) : !item ? (
        <p className="mt-8">Loading...</p>
      ) : (
        <section className={`${card} mt-8 space-y-6`}>
          <ContentCoverImage
            imageUrl={item.imageUrl}
            alt={`Photo for ${item.title}`}
          />
          <Block label="Description" value={item.description} />
          <Block label="Requirements" value={item.requirements} />
          <Block label="Instructions" value={item.instructions} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Block label="Phone" value={item.contactPhone} />
            <Block label="Email" value={item.contactEmail} />
            <Block label="Address" value={item.address} />
          </div>
          {item.externalUrl && (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex font-semibold text-emerald-700"
            >
              Visit service website ↗
            </a>
          )}
          {!authLoading && user?.role === "CITIZEN" && item.isActive && (
            <Link
              href={`/services/${item.id}/request`}
              className="inline-flex rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white"
            >
              Request This Service
            </Link>
          )}
          {!authLoading && !user && (
            <Link
              href="/login"
              className="inline-flex rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white"
            >
              Sign in to Request Service
            </Link>
          )}
        </section>
      )}
    </PublicShell>
  );
}
function Block({ label, value }: { label: string; value: string | null }) {
  return value ? (
    <div>
      <h2 className="text-sm font-bold uppercase text-slate-500">{label}</h2>
      <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
        {value}
      </p>
    </div>
  ) : null;
}
