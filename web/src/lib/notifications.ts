import { apiRequest } from "./api";
import type {
  Notification,
  NotificationListResponse,
} from "@/types/notification";

export function getNotifications(
  params: { page?: number; limit?: number; unreadOnly?: boolean } = {},
) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.unreadOnly) query.set("unreadOnly", "true");
  const suffix = query.size ? `?${query.toString()}` : "";
  return apiRequest<NotificationListResponse>(`/api/notifications${suffix}`);
}

export function getUnreadNotificationCount() {
  return apiRequest<{ count: number }>("/api/notifications/unread-count");
}

export function markNotificationRead(id: number) {
  return apiRequest<{ notification: Notification }>(
    `/api/notifications/${id}/read`,
    {
      method: "PATCH",
    },
  );
}

export function markAllNotificationsRead() {
  return apiRequest<{ updatedCount: number }>("/api/notifications/read-all", {
    method: "PATCH",
  });
}
