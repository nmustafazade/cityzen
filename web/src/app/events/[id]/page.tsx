"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ContentCoverImage } from "@/components/content/ContentCoverImage";
import { PublicShell, card } from "@/components/content/PublicListShell";
import { ReportLocationMap } from "@/components/maps/ReportLocationMap";
import { getEvent } from "@/lib/events";
import { formatDateTime } from "@/lib/format";
import { coordinatesFromValues, formatCoordinate } from "@/lib/location";
import type { CityEvent } from "@/types/event";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<CityEvent | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void getEvent(Number(id)).then((response) => setItem(response.event)).catch(() => setError("Event not found.")); }, [id]);
  const coordinates = item ? coordinatesFromValues(item.latitude, item.longitude) : null;
  return <PublicShell title={item?.title ?? "City Event"} subtitle={item?.department?.name ?? "Citywide"}><Link href="/events" className="mt-6 inline-flex font-semibold text-emerald-700">← Back to Events</Link>{error ? <p className="mt-8 text-red-700">{error}</p> : !item ? <p className="mt-8">Loading...</p> : <article className={`${card} mt-8 space-y-6`}><ContentCoverImage imageUrl={item.imageUrl} alt={`Photo for ${item.title}`}/><p className="whitespace-pre-wrap leading-8 text-slate-700">{item.description}</p><dl className="grid gap-4 sm:grid-cols-2"><Info label="Starts" value={formatDateTime(item.startsAt)}/><Info label="Ends" value={item.endsAt ? formatDateTime(item.endsAt) : null}/><Info label="Location" value={item.locationName}/><Info label="Address" value={item.address}/>{coordinates && <><Info label="Latitude" value={formatCoordinate(coordinates.latitude)}/><Info label="Longitude" value={formatCoordinate(coordinates.longitude)}/></>}</dl>{coordinates && <ReportLocationMap coordinates={coordinates} title={item.title}/>} {item.externalUrl && <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700">Event website ↗</a>}</article>}</PublicShell>;
}
function Info({ label, value }: { label: string; value: string | null }) { return value ? <div><dt className="text-xs font-bold uppercase text-slate-500">{label}</dt><dd className="mt-1 text-slate-800">{value}</dd></div> : null; }
