"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

// Batch a filter change and its page reset into one browser history entry.
let pending: URL | null = null;
function writeQuery(key: string, value: string | null) {
  if (!pending) {
    pending = new URL(window.location.href);
    queueMicrotask(() => {
      const next = pending;
      pending = null;
      if (next && next.href !== window.location.href) {
        window.history.pushState(null, "", `${next.pathname}${next.search}${next.hash}`);
      }
    });
  }
  if (value === null) pending.searchParams.delete(key);
  else pending.searchParams.set(key, value);
  if (key !== "page") pending.searchParams.delete("page");
}

export function useQueryState<T extends string | number | boolean>(
  key: string,
  fallback: T,
  allowed?: readonly string[],
): [T, Dispatch<SetStateAction<T>>] {
  const params = useSearchParams();
  const knownValues: Record<string, readonly string[]> = {
    role: ["CITIZEN", "EMPLOYEE", "DEPARTMENT_HEAD", "ADMIN"],
    status: ["active", "inactive", "SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "COMPLETED", "REJECTED", "CANCELLED"],
    priority: ["LOW", "MEDIUM", "HIGH", "URGENT"],
    sort: ["newest", "supported", "updated", "priority"],
    type: ["STREET", "GARAGE", "LOT", "UNDERGROUND"],
  };
  const choices = allowed ?? knownValues[key];
  const raw = params.get(key) ?? (key === "categoryId" ? params.get("category") : key === "departmentId" ? params.get("department") : null);
  let value: T = fallback;
  if (raw !== null) {
    if (typeof fallback === "number") {
      const number = Number(raw);
      if (Number.isSafeInteger(number) && number > 0) value = number as T;
    } else if (typeof fallback === "boolean") value = (raw === "true") as T;
    else if ((!choices || choices.includes(raw)) && (!key.endsWith("Id") || /^[1-9]\d*$/.test(raw))) value = raw as T;
  }
  const setValue = useCallback<Dispatch<SetStateAction<T>>>((update) => {
    const next = typeof update === "function" ? update(value) : update;
    writeQuery(key, next === fallback || next === "" ? null : String(next));
    // Normalize accepted short aliases so clearing a filter really clears it.
    if (key === "categoryId") pending?.searchParams.delete("category");
    if (key === "departmentId") pending?.searchParams.delete("department");
  }, [key, fallback, value]);
  return [value, setValue];
}

// A submitted search stays editable without adding a history entry per keystroke.
export function useQueryDraft(value: string): [string, (next: string) => void] {
  const [draft, setDraft] = useState({ source: value, text: value });
  if (draft.source !== value) setDraft({ source: value, text: value });
  return [draft.source === value ? draft.text : value, (text) => setDraft({ source: value, text })];
}
