import { NextResponse } from "next/server";
import { getEnv } from "../env";

/**
 * Strictly validates that an Origin header matches an exact trusted origin
 * from ALLOWED_ORIGINS (scheme + host + port). Never accepts "*" or arbitrary websites.
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Non-CORS / same-origin requests without Origin header
  if (origin === "null" || origin === "*") return false;

  let parsedOrigin: string;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    parsedOrigin = url.origin;
  } catch {
    return false;
  }

  const { allowedOrigins } = getEnv();
  return allowedOrigins.includes(parsedOrigin);
}

export function applyCorsHeaders(req: Request, res: NextResponse): NextResponse {
  const origin = req.headers.get("origin");
  if (origin && isAllowedOrigin(origin)) {
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
  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }
  const res = new NextResponse(null, { status: 204 });
  return applyCorsHeaders(req, res);
}
