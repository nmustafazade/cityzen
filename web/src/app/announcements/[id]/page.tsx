"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ContentCoverImage } from "@/components/content/ContentCoverImage";
import { PublicShell, card } from "@/components/content/PublicListShell";
import { getAnnouncement } from "@/lib/announcements";
import { formatDateTime } from "@/lib/format";
import type { Announcement } from "@/types/announcement";

export default function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Announcement | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void getAnnouncement(Number(id))
      .then((response) => setItem(response.announcement))
      .catch(() => setError("Announcement not found."));
  }, [id]);
  return (
    <PublicShell
      title={item?.title ?? "City Announcement"}
      subtitle={item?.department?.name ?? "Citywide"}
    >
      <Link
        href="/announcements"
        className="mt-6 inline-flex font-semibold text-emerald-700"
      >
        ← Back to Announcements
      </Link>
      {error ? (
        <p className="mt-8 text-red-700">{error}</p>
      ) : !item ? (
        <p className="mt-8">Loading...</p>
      ) : (
        <article className={`${card} mt-8 space-y-6`}>
          <ContentCoverImage
            imageUrl={item.imageUrl}
            alt={`Photo for ${item.title}`}
          />
          <div className="whitespace-pre-wrap leading-8 text-slate-700">
            {item.content}
          </div>
          <dl className="border-t pt-5 text-sm text-slate-500">
            {item.publishedAt && (
              <div>Published {formatDateTime(item.publishedAt)}</div>
            )}
            {item.expiresAt && (
              <div className="mt-1">
                Available until {formatDateTime(item.expiresAt)}
              </div>
            )}
          </dl>
        </article>
      )}
    </PublicShell>
  );
}
