import { apiRequest } from "./api";
import type { CityEvent, CityEventInput } from "@/types/event";
import type { PageMeta } from "./services";
const q = (p: Record<string, number | boolean | undefined>) => {
  const s = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined) s.set(k, String(v));
  });
  return s.size ? `?${s}` : "";
};
export const getEvents = (
  p: Record<string, number | boolean | undefined> = {},
) =>
  apiRequest<{ events: CityEvent[]; pagination: PageMeta }>(
    `/api/events${q(p)}`,
  );
export const getEvent = (id: number) =>
  apiRequest<{ event: CityEvent }>(`/api/events/${id}`);
export const getManagedEvents = (p: Record<string, number | undefined> = {}) =>
  apiRequest<{ events: CityEvent[]; pagination: PageMeta }>(
    `/api/municipality/events${q(p)}`,
  );
export const createEvent = (data: CityEventInput) =>
  apiRequest<{ event: CityEvent }>("/api/municipality/events", {
    method: "POST",
    body: data,
  });
export const updateEvent = (id: number, data: Partial<CityEventInput>) =>
  apiRequest<{ event: CityEvent }>(`/api/municipality/events/${id}`, {
    method: "PATCH",
    body: data,
  });
