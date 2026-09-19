export function ReportLoading({ message = "Loading reports..." }: { message?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-600" role="status">
        <span className="size-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        {message}
      </div>
    </div>
  );
}

export function ReportError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
      <p className="font-semibold text-red-800">We couldn&apos;t load this information.</p>
      <p className="mt-2 text-sm text-red-700">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
        Retry
      </button>
    </div>
  );
}
