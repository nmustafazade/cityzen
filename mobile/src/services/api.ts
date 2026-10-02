import { getToken, removeToken } from "./token";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
export class ApiError extends Error { constructor(message:string, public status:number) { super(message); } }
type Options = Omit<RequestInit,"body"> & { body?:unknown; token?:string|null; timeoutMs?:number };
export async function api<T>(path:string, options:Options = {}):Promise<T> {
  if (!API_URL) throw new ApiError("EXPO_PUBLIC_API_URL is not configured.", 0);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);
  const token = options.token === undefined ? await getToken() : options.token;
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = new Headers(options.headers);
  if (!isForm && options.body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  try {
    const response = await fetch(`${API_URL}${path}`, { ...options, body: options.body === undefined ? undefined : isForm ? options.body as BodyInit : JSON.stringify(options.body), headers, signal:controller.signal });
    const payload = await response.json().catch(() => ({})) as {message?:string};
    if (!response.ok) { if (response.status === 401) await removeToken(); throw new ApiError(payload.message || "The request could not be completed.", response.status); }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new ApiError("The request timed out. Please try again.", 0);
    throw new ApiError("Unable to connect to Cityzen. Check your connection.", 0);
  } finally { clearTimeout(timer); }
}
export function mediaUrl(path:string|null|undefined) { if (!path) return undefined; return /^https?:\/\//.test(path) ? path : `${API_URL}${path}`; }
