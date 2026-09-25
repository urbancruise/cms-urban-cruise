// ============================================================
// Browser-side fetch wrapper — sends CSRF automatically
// ============================================================
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "./constants";

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getCsrf(): string | null {
  if (typeof document === "undefined") return null;
  const re = new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`);
  const m = document.cookie.match(re);
  return m?.[1] ?? null;
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  cache?: RequestCache;
}

export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (method !== "GET") {
    const csrf = getCsrf();
    if (csrf) headers[CSRF_HEADER_NAME] = csrf;
  }

  const res = await fetch(path, {
    method,
    headers,
    credentials: "same-origin",
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    cache: opts.cache,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error || `HTTP ${res.status}`, res.status);
  }
  return data as T;
}
