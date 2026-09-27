import { formatDateTime } from "@/lib/format";
import type { ServiceRequestHistory } from "@/types/service-request";
import { serviceRequestStatusLabel } from "./ServiceRequestStatusBadge";

export function ServiceRequestTimeline({ history }: { history: ServiceRequestHistory[] }) {
  return <ol className="mt-5 space-y-5 border-l-2 border-emerald-100 pl-5">{history.map((entry) => <li key={entry.id} className="relative"><span className="absolute -left-[1.7rem] top-1 size-3 rounded-full bg-emerald-600 ring-4 ring-white"/><h3 className="font-bold text-slate-900">{serviceRequestStatusLabel(entry.newStatus)}</h3><p className="mt-1 text-xs text-slate-500">{formatDateTime(entry.createdAt)} · {entry.changedBy.firstName} {entry.changedBy.lastName}</p>{entry.note && <p className="mt-2 text-sm leading-6 text-slate-600">{entry.note}</p>}</li>)}</ol>;
}
