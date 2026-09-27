import type { ReportStatus } from "./report";
import type { UserRole } from "./user";

export type NotificationType =
  | "REPORT_CREATED"
  | "REPORT_ASSIGNED"
  | "REPORT_STATUS_CHANGED"
  | "REPORT_COMMENT"
  | "REPORT_RESOLVED";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  report: { id: number; title: string; status: ReportStatus } | null;
  actor: {
    id: number;
    firstName: string;
    lastName: string;
    role: UserRole;
  } | null;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
