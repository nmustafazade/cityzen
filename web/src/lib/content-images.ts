import { apiRequest } from "./api";

export type ContentImageKind = "services" | "announcements" | "events";

export function uploadContentImage(
  kind: ContentImageKind,
  id: number,
  file: File,
) {
  const body = new FormData();
  body.append("image", file);

  return apiRequest<{ imageUrl: string }>(
    `/api/municipality/${kind}/${id}/image`,
    { method: "POST", body },
  );
}
