import { getStoredToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

interface ApiErrorBody {
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string | null;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  if (!API_URL) {
    throw new ApiError(
      "The web application is not configured to reach the API.",
      0,
    );
  }

  const headers = new Headers(options.headers);
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData) headers.set("Content-Type", "application/json");
  const token = options.token === undefined ? getStoredToken() : options.token;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let requestBody: BodyInit | undefined;
  if (options.body !== undefined) {
    requestBody = isFormData
      ? (options.body as FormData)
      : JSON.stringify(options.body);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      body: requestBody,
    });
  } catch {
    throw new ApiError("Unable to connect to Cityzen. Please try again.", 0);
  }

  const data = (await response.json().catch(() => null)) as
    ApiErrorBody | T | null;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && data.message
        ? data.message
        : "Something went wrong. Please try again.";
    throw new ApiError(message, response.status);
  }

  return data as T;
}
