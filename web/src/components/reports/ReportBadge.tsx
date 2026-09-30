import {
  reportPriorityLabels,
  reportStatusLabels,
} from "@/lib/format";
import type { ReportPriority, ReportStatus } from "@/types/report";

const statusStyles: Record<ReportStatus, string> = {
  SUBMITTED: "border-blue-200 bg-blue-50 text-blue-700",
  UNDER_REVIEW: "border-violet-200 bg-violet-50 text-violet-700",
  ASSIGNED: "border-cyan-200 bg-cyan-50 text-cyan-700",
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-800",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
};

const priorityStyles: Record<ReportPriority, string> = {
  LOW: "border-slate-200 bg-slate-50 text-slate-600",
  MEDIUM: "border-blue-200 bg-blue-50 text-blue-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  URGENT: "border-red-200 bg-red-50 text-red-700",
};

const baseStyle = "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-extrabold tracking-wide";

export function StatusBadge({ status }: { status: ReportStatus }) {
  return <span className={`${baseStyle} ${statusStyles[status]}`}><span className="size-1.5 rounded-full bg-current" aria-hidden />{reportStatusLabels[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: ReportPriority }) {
  return <span className={`${baseStyle} ${priorityStyles[priority]}`}>{reportPriorityLabels[priority]} priority</span>;
}
