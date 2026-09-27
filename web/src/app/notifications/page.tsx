"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";
import type { Notification } from "@/types/notification";
import type { UserRole } from "@/types/user";

const roleLabels: Record<UserRole, string> = {
  CITIZEN: "Citizen",
  EMPLOYEE: "Municipality Employee",
  DEPARTMENT_HEAD: "Department Head",
  ADMIN: "Administrator",
};

function NotificationsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await getNotifications({ page, limit: 20, unreadOnly });
      setNotifications(response.notifications);
      setTotalPages(Math.max(response.pagination.totalPages, 1));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Unable to load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [page, unreadOnly]);

  useEffect(() => {
    const request = window.setTimeout(() => void loadNotifications(), 0);
    return () => window.clearTimeout(request);
  }, [loadNotifications]);

  function destination(notification: Notification) {
    if (!notification.report || !user) return null;
    return user.role === "CITIZEN"
      ? `/reports/${notification.report.id}`
      : `/employee/reports/${notification.report.id}`;
  }

  function openNotification(notification: Notification) {
    const href = destination(notification);
    if (!notification.isRead) {
      setNotifications((current) => current.map((item) => item.id === notification.id
        ? { ...item, isRead: true, readAt: new Date().toISOString() }
        : item));
      void markNotificationRead(notification.id)
        .then(() => refreshUnreadCount())
        .catch(() => loadNotifications());
    }
    if (href) router.push(href);
  }

  async function markAllRead() {
    setIsMarkingAll(true);
    setError(null);
    try {
      await markAllNotificationsRead();
      if (unreadOnly) await loadNotifications();
      else setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      await refreshUnreadCount();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Unable to mark notifications as read.");
    } finally {
      setIsMarkingAll(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 sm:py-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Notifications</h1>
          <p className="mt-2 text-slate-600">Updates about your Cityzen activity.</p>
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={() => void markAllRead()} disabled={isMarkingAll} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
            {isMarkingAll ? "Marking as read..." : "Mark all as read"}
          </button>
        )}
      </div>

      <div className="mt-8 flex gap-2" aria-label="Notification filter">
        {[{ label: "All", value: false }, { label: "Unread", value: true }].map((filter) => (
          <button key={filter.label} type="button" aria-pressed={unreadOnly === filter.value} onClick={() => { setIsLoading(true); setError(null); setUnreadOnly(filter.value); setPage(1); }} className={`rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${unreadOnly === filter.value ? "bg-emerald-600 text-white" : "border border-slate-300 bg-white text-slate-700 hover:border-emerald-600"}`}>
            {filter.label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span>{error}</span>
          <button type="button" onClick={() => { setIsLoading(true); setError(null); void loadNotifications(); }} className="font-bold underline underline-offset-2">Retry</button>
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600"><span className="size-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-bold text-slate-900">No notifications yet</h2>
          <p className="mt-2 text-sm text-slate-600">Updates about your reports and Cityzen activity will appear here.</p>
        </section>
      ) : (
        <ul className="mt-8 space-y-3">
          {notifications.map((notification) => {
            const href = destination(notification);
            return (
              <li key={notification.id} className={`rounded-2xl border p-5 shadow-sm ${notification.isRead ? "border-slate-200 bg-white" : "border-emerald-200 bg-emerald-50/60"}`}>
                <button type="button" onClick={() => openNotification(notification)} className="w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600" aria-label={`${notification.isRead ? "Read" : "Unread"}: ${notification.title}${href ? ". Open report" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className={`text-base text-slate-950 ${notification.isRead ? "font-semibold" : "font-bold"}`}>{notification.title}</h2>
                        {!notification.isRead && <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-bold text-white">Unread</span>}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{notification.message}</p>
                      {notification.actor && <p className="mt-2 text-xs text-slate-500">By {notification.actor.firstName} {notification.actor.lastName} · {roleLabels[notification.actor.role]}</p>}
                    </div>
                    {href && <span aria-hidden="true" className="text-xl text-emerald-700">→</span>}
                  </div>
                  <time dateTime={notification.createdAt} className="mt-3 block text-xs text-slate-500">{formatDateTime(notification.createdAt)}</time>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!isLoading && notifications.length > 0 && (
        <nav aria-label="Notification pagination" className="mt-8 flex items-center justify-between gap-4">
          <button type="button" disabled={page === 1} onClick={() => { setIsLoading(true); setPage((current) => current - 1); }} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
          <span className="text-sm font-medium text-slate-600">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => { setIsLoading(true); setPage((current) => current + 1); }} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">Next</button>
        </nav>
      )}
    </main>
  );
}

export default function NotificationsPage() {
  return <ProtectedRoute><NotificationsContent /></ProtectedRoute>;
}
