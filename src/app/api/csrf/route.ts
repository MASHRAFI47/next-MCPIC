import { NextResponse } from "next/server";
import { applyCorsHeaders } from "@/lib/security/cors";
import { CSRF_COOKIE_NAME, issueCsrfCookie, parseCookieHeader } from "@/lib/security/csrf";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const existing = parseCookieHeader(req.headers.get("cookie"), CSRF_COOKIE_NAME);
  const res = NextResponse.json({ ok: true });
  const token = issueCsrfCookie(res, existing);
  res.headers.set("Cache-Control", "no-store");
  const finalRes = NextResponse.json({ csrfToken: token });
  // Copy Set-Cookie onto the JSON response
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) finalRes.headers.set("set-cookie", setCookie);
  finalRes.headers.set("Cache-Control", "no-store");
  return applyCorsHeaders(req, finalRes);
}
