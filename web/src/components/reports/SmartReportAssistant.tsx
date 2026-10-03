"use client";
import { useState } from "react";
import {
  draftReportResponse,
  suggestReportPriority,
  summarizeReport,
} from "@/lib/ai";
export function SmartReportAssistant({ reportId }: { reportId: number }) {
  const [busy, setBusy] = useState(""),
    [summary, setSummary] = useState(""),
    [draft, setDraft] = useState(""),
    [priority, setPriority] = useState<{
      priority: string;
      confidence: number;
      reasons: string[];
    } | null>(null),
    [error, setError] = useState("");
  const run = async (kind: string, fn: () => Promise<void>) => {
    setBusy(kind);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assistance is unavailable");
    } finally {
      setBusy("");
    }
  };
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <h2 className="text-lg font-bold">Smart Assistance</h2>
      <p className="mt-1 text-xs text-slate-600">
        Suggestions are advisory. Review and edit them before use.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          disabled={!!busy}
          onClick={() =>
            void run("summary", async () =>
              setSummary((await summarizeReport(reportId)).summary ?? ""),
            )
          }
          className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold"
        >
          {busy === "summary" ? "Summarizing..." : "Summarize"}
        </button>
        <button
          disabled={!!busy}
          onClick={() =>
            void run("priority", async () =>
              setPriority(await suggestReportPriority(reportId)),
            )
          }
          className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold"
        >
          {busy === "priority" ? "Analyzing..." : "Suggest priority"}
        </button>
        <button
          disabled={!!busy}
          onClick={() =>
            void run("draft", async () =>
              setDraft((await draftReportResponse(reportId)).draft ?? ""),
            )
          }
          className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold"
        >
          {busy === "draft" ? "Drafting..." : "Draft response"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      {summary && (
        <div className="mt-4 rounded-lg bg-white p-3 text-sm leading-6">
          <strong>Summary</strong>
          <p>{summary}</p>
        </div>
      )}
      {priority && (
        <div className="mt-4 rounded-lg bg-white p-3 text-sm">
          <strong>Suggested priority: {priority.priority}</strong>
          <p>
            {Math.round(priority.confidence * 100)}% confidence ·{" "}
            {priority.reasons.join("; ")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            This does not change report priority.
          </p>
        </div>
      )}
      {draft && (
        <label className="mt-4 block text-sm font-semibold">
          Editable response draft
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            className="mt-2 w-full rounded-lg border bg-white px-3 py-2 font-normal"
          />
        </label>
      )}
    </section>
  );
}
