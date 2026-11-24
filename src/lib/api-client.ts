"use client";

const CSRF_COOKIE = "mcpic_csrf_token";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const pairs = document.cookie.split(";");
  for (const pair of pairs) {
    const [rawKey, ...rest] = pair.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

const SIGNED_CSRF_RE = /^[a-f0-9]{64}\.[a-f0-9]{64}$/;

async function ensureCsrfToken(): Promise<string> {
  const existing = readCookie(CSRF_COOKIE);
  if (existing && SIGNED_CSRF_RE.test(existing)) {
    return existing;
  }
  const res = await fetch("/api/csrf", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Could not initialize security token");
  }
  const data = (await res.json()) as { csrfToken?: string };
  if (!data.csrfToken) {
    throw new Error("Missing CSRF token");
  }
  return data.csrfToken;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Same-origin fetch wrapper that automatically attaches the double-submit
 * X-CSRF-Token header on state-changing requests. Uses zero localStorage tokens.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(method);
  const headers = new Headers(options.headers);

  if (isMutation) {
    const csrfToken = await ensureCsrfToken();
    headers.set("X-CSRF-Token", csrfToken);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: "same-origin",
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : null) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return payload as T;
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const data = await apiFetch<{ url: string }>("/api/upload", {
    method: "POST",
    body: formData,
  });
  return data.url;
}
