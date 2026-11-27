import { NextResponse } from "next/server";
import { getEnv } from "../env";

/**
 * In local development ONLY, allows same-origin requests from http://localhost:<port>
 * or http://127.0.0.1:<port> when the Origin strictly matches the request's Host header
 * (e.g. when `next dev` falls back to port 3001 while ALLOWED_ORIGINS is port 3000).
 * Always disabled in production and always blocks cross-origin requests.
 */
function isDevSameOriginLocalhost(parsedUrl: URL, req?: Request): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (parsedUrl.protocol !== "http:") return false;
  if (parsedUrl.hostname !== "localhost" && parsedUrl.hostname !== "127.0.0.1") {
    return false;
  }
  const hostHeader = req?.headers.get("host")?.trim().toLowerCase();
  if (!hostHeader) return false;
  return parsedUrl.host.toLowerCase() === hostHeader;
}

/**
 * Strictly validates that an Origin header matches an exact trusted origin
 * from ALLOWED_ORIGINS (scheme + host + port). Never accepts "*" or arbitrary websites.
 */
export function isAllowedOrigin(origin: string | null, req?: Request): boolean {
  if (!origin) return true; // Non-CORS / same-origin requests without Origin header
  if (origin === "null" || origin === "*") return false;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(origin);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") return false;
  } catch {
    return false;
  }

  const { allowedOrigins } = getEnv();
  if (allowedOrigins.includes(parsedUrl.origin)) {
    return true;
  }

  return isDevSameOriginLocalhost(parsedUrl, req);
}

export function applyCorsHeaders(req: Request, res: NextResponse): NextResponse {
  const origin = req.headers.get("origin");
  if (origin && isAllowedOrigin(origin, req)) {
    const exactOrigin = new URL(origin).origin;
    res.headers.set("Access-Control-Allow-Origin", exactOrigin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token");
    res.headers.set("Access-Control-Max-Age", "600");
    res.headers.set("Vary", "Origin");
  }
  return res;
}

export function handleCorsPreflight(req: Request): NextResponse {
  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin, req)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }
  const res = new NextResponse(null, { status: 204 });
  return applyCorsHeaders(req, res);
}
