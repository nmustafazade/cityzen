import { formatDateTime, reportStatusLabels } from "@/lib/format";
import type { ReportStatusHistory } from "@/types/report";

export function ReportTimeline({ history }: { history?: ReportStatusHistory[] }) {
  if (!history?.length) {
    return <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">No status history is available yet.</p>;
  }

  return (
    <ol className="space-y-0">
      {history.map((entry, index) => {
        const changedBy = entry.changedBy
          ? `${entry.changedBy.firstName} ${entry.changedBy.lastName}`
          : null;
        const isLast = index === history.length - 1;

        return (
          <li key={entry.id} className="relative grid grid-cols-[2rem_1fr] gap-3 pb-7 last:pb-0">
            {!isLast && <span className="absolute left-[0.45rem] top-4 h-full w-px bg-slate-200" aria-hidden="true" />}
            <span className="relative mt-1 size-4 rounded-full border-4 border-emerald-100 bg-emerald-600" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-slate-950">{reportStatusLabels[entry.newStatus]}</h3>
              {entry.oldStatus && (
                <p className="mt-1 text-xs font-medium text-slate-500">Previously {reportStatusLabels[entry.oldStatus]}</p>
              )}
              {changedBy && <p className="mt-2 text-sm text-slate-600">Changed by {changedBy}</p>}
              {entry.note && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">{entry.note}</p>}
              <p className="mt-2 text-sm text-slate-500">{formatDateTime(entry.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
