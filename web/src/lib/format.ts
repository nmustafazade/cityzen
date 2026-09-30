import type { ReportPriority, ReportStatus } from "@/types/report";
import type { UserRole } from "@/types/user";

export const roleLabels:Record<UserRole,string>={CITIZEN:"Citizen",EMPLOYEE:"Municipality Employee",DEPARTMENT_HEAD:"Department Head",ADMIN:"Administrator"};

export const reportStatusLabels: Record<ReportStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const reportPriorityLabels: Record<ReportPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : dateTimeFormatter.format(date);
}
