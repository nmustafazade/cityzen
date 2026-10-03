import { apiRequest } from "./api";
import type { Announcement, AnnouncementInput } from "@/types/announcement";
import type { PageMeta } from "./services";
const q = (p: Record<string, number | undefined>) => {
  const s = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined) s.set(k, String(v));
  });
  return s.size ? `?${s}` : "";
};
export const getAnnouncements = (p: Record<string, number | undefined> = {}) =>
  apiRequest<{ announcements: Announcement[]; pagination: PageMeta }>(
    `/api/announcements${q(p)}`,
  );
export const getAnnouncement = (id: number) =>
  apiRequest<{ announcement: Announcement }>(`/api/announcements/${id}`);
export const getManagedAnnouncements = (
  p: Record<string, number | undefined> = {},
) =>
  apiRequest<{ announcements: Announcement[]; pagination: PageMeta }>(
    `/api/municipality/announcements${q(p)}`,
  );
export const createAnnouncement = (data: AnnouncementInput) =>
  apiRequest<{ announcement: Announcement }>(
    "/api/municipality/announcements",
    { method: "POST", body: data },
  );
export const updateAnnouncement = (
  id: number,
  data: Partial<AnnouncementInput>,
) =>
  apiRequest<{ announcement: Announcement }>(
    `/api/municipality/announcements/${id}`,
    { method: "PATCH", body: data },
  );
