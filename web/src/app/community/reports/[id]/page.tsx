"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getPublicComments, getPublicReport } from "@/lib/community";
import { createReportComment, toggleReportUpvote } from "@/lib/reports";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime as formatDate } from "@/lib/format";
import { StatusBadge as ReportStatusBadge } from "@/components/reports/ReportBadge";
import { ReportImageGallery } from "@/components/reports/ReportImageGallery";
import { ReportLocationMap } from "@/components/maps/ReportLocationMap";
import type { PublicComment, PublicReport } from "@/types/community";
export default function Page() {
  const { id } = useParams<{ id: string }>(),
    router = useRouter(),
    { user, isAuthenticated } = useAuth();
  const [report, setReport] = useState<PublicReport | null>(null),
    [comments, setComments] = useState<PublicComment[]>([]),
    [content, setContent] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(
    () =>
      Promise.all([getPublicReport(Number(id)), getPublicComments(Number(id))])
        .then(([a, b]) => {
          setReport(a.report);
          setComments(b.comments);
        })
        .catch((e: Error) => setError(e.message)),
    [id],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function support() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      const result = await toggleReportUpvote(Number(id));
      setReport((current) =>
        current ? { ...current, upvoteCount: result.upvoteCount } : current,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to support issue");
    } finally {
      setBusy(false);
    }
  }
  async function comment() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!content.trim()) return;
    setBusy(true);
    try {
      await createReportComment(Number(id), content);
      setContent("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to comment");
    } finally {
      setBusy(false);
    }
  }
  if (error && !report)
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p role="alert">{error}</p>
      </main>
    );
  if (!report)
    return <main className="p-12 text-center">Loading public issue...</main>;
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/community" className="font-semibold text-emerald-700">
        ← City Issues
      </Link>
      <div className="mt-6 flex flex-wrap justify-between gap-4">
        <div>
          <p className="font-semibold text-emerald-700">
            {report.category.name}
          </p>
          <h1 className="mt-2 text-4xl font-bold">{report.title}</h1>
        </div>
        <ReportStatusBadge status={report.status} />
      </div>
      <p className="mt-6 whitespace-pre-wrap text-slate-700">
        {report.description}
      </p>
      <p className="mt-4 text-sm text-slate-500">
        {report.department?.name || "Municipality"} · Reported{" "}
        {formatDate(report.createdAt)}
      </p>
      {report.latitude != null && report.longitude != null && (
        <section className="mt-8">
          <h2 className="text-xl font-bold">Approximate Location</h2>
          <p className="mb-3 text-sm text-slate-500">
            For privacy, the marker shows only the general area.
          </p>
          <ReportLocationMap
            coordinates={{
              latitude: Number(report.latitude),
              longitude: Number(report.longitude),
            }}
          />
        </section>
      )}
      <section className="mt-8">
        <ReportImageGallery images={report.images} reportTitle={report.title} />
      </section>
      <button
        onClick={support}
        disabled={busy || user?.role !== "CITIZEN"}
        className="mt-8 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        ▲ {report.upvoteCount}{" "}
        {isAuthenticated ? "Support this issue" : "Sign in to support"}
      </button>
      <section className="mt-10">
        <h2 className="text-2xl font-bold">Discussion</h2>
        {comments.length === 0 ? (
          <p className="mt-4 text-slate-500">No comments yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {comments.map((item) => (
              <article key={item.id} className="rounded-xl border bg-white p-4">
                <p className="font-semibold">{item.user.displayName}</p>
                <p className="mt-2 whitespace-pre-wrap">{item.content}</p>
                <time className="mt-2 block text-xs text-slate-500">
                  {formatDate(item.createdAt)}
                </time>
              </article>
            ))}
          </div>
        )}
        <textarea
          maxLength={1000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="mt-5 min-h-24 w-full rounded-lg border p-3"
        />
        <button
          onClick={comment}
          disabled={busy || !content.trim()}
          className="mt-2 rounded-lg border px-4 py-2 font-semibold"
        >
          Post Comment
        </button>
      </section>
    </main>
  );
}
