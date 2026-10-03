"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import {
  createReportComment,
  deleteReportComment,
  getReportComments,
} from "@/lib/reports";
import type { ReportComment } from "@/types/report";
import type { UserRole } from "@/types/user";

const roleLabels: Record<UserRole, string> = {
  CITIZEN: "Citizen",
  EMPLOYEE: "Municipality Employee",
  DEPARTMENT_HEAD: "Department Head",
  ADMIN: "Administrator",
};

export function ReportComments({ reportId }: { reportId: number }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReportComment | null>(null);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleError = useCallback(
    (caught: unknown, fallback: string) => {
      if (caught instanceof ApiError && caught.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError(caught instanceof ApiError ? caught.message : fallback);
    },
    [logout, router],
  );

  const loadComments = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    setError("");
    try {
      setComments((await getReportComments(reportId)).comments);
    } catch (caught) {
      handleError(caught, "Unable to load comments.");
    } finally {
      setIsLoading(false);
    }
  }, [handleError, reportId]);

  useEffect(() => {
    let current = true;
    void getReportComments(reportId)
      .then((response) => {
        if (current) setComments(response.comments);
      })
      .catch((caught: unknown) => {
        if (current) handleError(caught, "Unable to load comments.");
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
    const trimmed = content.trim();
    if (!trimmed) {
      setError("Write a comment before posting.");
      return;
    }
    if (trimmed.length > 1000 || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await createReportComment(
        reportId,
        trimmed,
        replyingTo?.id,
      );
      setComments((current) => [...current, response.comment]);
      setContent("");
      setReplyingTo(null);
    } catch (caught) {
      handleError(caught, "Unable to post your comment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeComment(commentId: number) {
    if (deletingId !== null) return;
    setDeletingId(commentId);
    setError("");
    try {
      await deleteReportComment(reportId, commentId);
      setComments((current) =>
        current
          .filter((comment) => comment.id !== commentId)
          .map((comment) =>
            comment.parentComment?.id === commentId
              ? { ...comment, parentComment: null }
              : comment,
          ),
      );
      if (replyingTo?.id === commentId) setReplyingTo(null);
      setConfirmingId(null);
    } catch (caught) {
      handleError(caught, "Unable to delete this comment.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      aria-labelledby="discussion-title"
    >
      <h2 id="discussion-title" className="text-xl font-bold text-slate-950">
        Discussion
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Share updates and context about this report.
      </p>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading comments...</p>
        ) : comments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="font-semibold text-slate-900">No comments yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              Start the conversation about this report.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {comments.map((comment) => {
              const canDelete =
                user?.id === comment.user.id || user?.role === "ADMIN";
              return (
                <li
                  key={comment.id}
                  className={`py-5 first:pt-0 last:pb-0 ${comment.parentComment ? "ml-5 border-l-2 border-emerald-100 pl-4 sm:ml-8" : ""}`}
                >
                  {comment.parentComment && (
                    <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">
                        Replying to {comment.parentComment.user.firstName}{" "}
                        {comment.parentComment.user.lastName}
                      </p>
                      <p className="mt-1 line-clamp-2">
                        {comment.parentComment.content}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {comment.user.firstName} {comment.user.lastName}
                      </p>
                      <p className="text-xs font-medium text-emerald-700">
                        {roleLabels[comment.user.role]}
                      </p>
                    </div>
                    <time
                      dateTime={comment.createdAt}
                      className="text-xs text-slate-500"
                    >
                      {formatDateTime(comment.createdAt)}
                    </time>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                    {comment.content}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(comment);
                        setError("");
                        requestAnimationFrame(() =>
                          textareaRef.current?.focus(),
                        );
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                      Reply
                    </button>
                    {canDelete &&
                      (confirmingId === comment.id ? (
                        <div
                          className="mt-3 flex flex-wrap items-center gap-2"
                          role="group"
                          aria-label="Confirm comment deletion"
                        >
                          <span className="text-xs text-slate-600">
                            Delete this comment?
                          </span>
                          <button
                            type="button"
                            disabled={deletingId !== null}
                            onClick={() => void removeComment(comment.id)}
                            className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {deletingId === comment.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                          <button
                            type="button"
                            disabled={deletingId !== null}
                            onClick={() => setConfirmingId(null)}
                            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingId(comment.id)}
                          className="text-xs font-semibold text-red-700 hover:text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                        >
                          Delete
                        </button>
                      ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form onSubmit={submit} className="mt-7 border-t border-slate-200 pt-6">
        {replyingTo && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            <span>
              Replying to{" "}
              <strong>
                {replyingTo.user.firstName} {replyingTo.user.lastName}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-xs font-semibold text-emerald-800 underline"
            >
              Cancel reply
            </button>
          </div>
        )}
        <label
          htmlFor={`comment-${reportId}`}
          className="mb-1.5 block text-sm font-semibold text-slate-800"
        >
          {replyingTo ? "Write a reply" : "Add a comment"}
        </label>
        <textarea
          ref={textareaRef}
          id={`comment-${reportId}`}
          rows={4}
          maxLength={1000}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={isSubmitting}
          placeholder={
            replyingTo
              ? `Reply to ${replyingTo.user.firstName}...`
              : "Write a comment..."
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100 disabled:bg-slate-100"
        />
        <div className="mt-2 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-400">{content.length}/1000</span>
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Posting..."
              : replyingTo
                ? "Post Reply"
                : "Post Comment"}
          </button>
        </div>
      </form>
      {error && !isLoading && comments.length === 0 && (
        <button
          type="button"
          onClick={() => void loadComments()}
          className="mt-4 text-sm font-semibold text-emerald-700"
        >
          Retry comments
        </button>
      )}
    </section>
  );
}
