"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { getReportFeedback, saveReportFeedback } from "@/lib/reports";
import type { ReportFeedback } from "@/types/report";

export function ResolutionFeedback({
  reportId,
  editable,
}: {
  reportId: number;
  editable: boolean;
}) {
  const router = useRouter();
  const { logout } = useAuth();
  const [feedback, setFeedback] = useState<ReportFeedback | null>(null);
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleError = useCallback(
    (caught: unknown) => {
      if (caught instanceof ApiError && caught.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Unable to load resolution feedback.",
      );
    },
    [logout, router],
  );

  useEffect(() => {
    let current = true;
    void getReportFeedback(reportId)
      .then((response) => {
        if (!current) return;
        setFeedback(response.feedback);
        if (response.feedback) {
          setConfirmed(response.feedback.confirmed);
          setRating(response.feedback.rating);
          setComment(response.feedback.comment ?? "");
        }
      })
      .catch((caught: unknown) => {
        if (current) handleError(caught);
      })
      .finally(() => {
        if (current) setIsLoading(false);
      });
    return () => {
      current = false;
    };
  }, [handleError, reportId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmed === null || rating < 1 || rating > 5 || isSaving) {
      setError(
        "Choose whether the issue was resolved and select a rating from 1 to 5.",
      );
      return;
    }
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await saveReportFeedback(reportId, {
        confirmed,
        rating,
        comment: comment.trim() || null,
      });
      setFeedback(response.feedback);
      setSuccess(
        feedback ? "Feedback updated." : "Thank you for your feedback.",
      );
    } catch (caught) {
      handleError(caught);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      aria-labelledby="feedback-title"
    >
      <h2 id="feedback-title" className="text-xl font-bold text-slate-950">
        {editable ? "Resolution Feedback" : "Citizen Resolution Feedback"}
      </h2>
      {isLoading ? (
        <p className="mt-4 text-sm text-slate-500">Loading feedback...</p>
      ) : error && !editable ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : editable ? (
        <form onSubmit={submit} className="mt-6 space-y-6">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          {success && (
            <p
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              {success}
            </p>
          )}
          <fieldset>
            <legend className="text-sm font-semibold text-slate-800">
              Was this issue actually resolved?
            </legend>
            <div className="mt-3 flex gap-4">
              {[true, false].map((value) => (
                <label
                  key={String(value)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium"
                >
                  <input
                    type="radio"
                    name="confirmed"
                    checked={confirmed === value}
                    onChange={() => setConfirmed(value)}
                  />
                  {value ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-semibold text-slate-800">
              Rate the municipality response
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <label
                  key={value}
                  className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold has-checked:border-emerald-600 has-checked:bg-emerald-50 has-checked:text-emerald-800"
                >
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    checked={rating === value}
                    onChange={() => setRating(value)}
                    className="sr-only"
                  />
                  {value} ★
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label
              htmlFor={`feedback-comment-${reportId}`}
              className="mb-1.5 block text-sm font-semibold text-slate-800"
            >
              Additional feedback{" "}
              <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <textarea
              id={`feedback-comment-${reportId}`}
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100"
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {comment.length}/1000
            </p>
          </div>
          <button
            type="submit"
            disabled={confirmed === null || rating === 0 || isSaving}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving
              ? "Saving..."
              : feedback
                ? "Update Feedback"
                : "Submit Feedback"}
          </button>
        </form>
      ) : feedback ? (
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <FeedbackItem
            label="Confirmed resolved"
            value={feedback.confirmed ? "Yes" : "No"}
          />
          <FeedbackItem label="Rating" value={`${feedback.rating} / 5`} />
          {feedback.comment && (
            <div className="sm:col-span-2">
              <FeedbackItem label="Comment" value={feedback.comment} />
            </div>
          )}
        </dl>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No citizen feedback yet.</p>
      )}
    </section>
  );
}

function FeedbackItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1.5 whitespace-pre-wrap text-sm font-medium text-slate-900">
        {value}
      </dd>
    </div>
  );
}
