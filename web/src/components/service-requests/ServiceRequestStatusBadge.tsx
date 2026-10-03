import type { ServiceRequestStatus } from "@/types/service-request";

const labels: Record<ServiceRequestStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Resolved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};
const styles: Record<ServiceRequestStatus, string> = {
  SUBMITTED: "bg-blue-50 text-blue-800",
  UNDER_REVIEW: "bg-amber-50 text-amber-800",
  ASSIGNED: "bg-violet-50 text-violet-800",
  IN_PROGRESS: "bg-cyan-50 text-cyan-800",
  COMPLETED: "bg-emerald-50 text-emerald-800",
  REJECTED: "bg-red-50 text-red-800",
  CANCELLED: "bg-slate-100 text-slate-700",
};
export function serviceRequestStatusLabel(status: ServiceRequestStatus) {
  return labels[status];
}
export function ServiceRequestStatusBadge({
  status,
}: {
  status: ServiceRequestStatus;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border border-current/15 px-3 py-1 text-[11px] font-extrabold tracking-wide ${styles[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {labels[status]}
    </span>
  );
}
