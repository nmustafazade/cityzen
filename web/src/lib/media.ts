const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export function resolveMediaUrl(imageUrl: string): string {
  if (imageUrl.startsWith("/uploads/")) {
    return API_URL ? `${API_URL}${imageUrl}` : "";
  }

  try {
    const url = new URL(imageUrl);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}
