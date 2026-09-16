"use client";

// ============================================================
// Fetch wrapper with CSRF + JSON
// ============================================================
function getCsrf(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/csrf_token=([^;]+)/);
  return m?.[1] ?? null;
}

export async function apiClient<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrf = getCsrf();
    if (csrf) headers["x-csrf-token"] = csrf;
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  }

  const res = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const b = await res.json();
      msg = b.error || msg;
    } catch {}
    const err: any = new Error(msg);
    err.status = res.status;
    throw err;
  }

  return res.json();
}