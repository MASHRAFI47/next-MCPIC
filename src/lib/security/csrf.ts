import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getEnv } from "../env";
import { isAllowedOrigin } from "./cors";
import { randomTokenHex, timingSafeEqualStr } from "./crypto";

export const CSRF_COOKIE_NAME = "mcpic_csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";

const SIGNED_TOKEN_RE = /^[a-f0-9]{64}\.[a-f0-9]{64}$/;

function signNonce(nonce: string): string {
  const { nextAuthSecret } = getEnv();
  return crypto
    .createHmac("sha256", nextAuthSecret)
    .update(`mcpic-csrf:${nonce}`)
    .digest("hex");
}

/**
 * Generates an unpredictable CSPRNG 256-bit nonce signed with a server-only HMAC-SHA256.
 * Prevents both token prediction and subdomain cookie-tossing attacks.
 */
export function generateCsrfToken(): string {
  const nonce = randomTokenHex(32); // 256 bits from crypto.randomBytes
  const signature = signNonce(nonce);
  return `${nonce}.${signature}`;
}

export function isValidSignedCsrfToken(token: string | null | undefined): token is string {
  if (!token || !SIGNED_TOKEN_RE.test(token)) return false;
  const [nonce, providedSig] = token.split(".");
  const expectedSig = signNonce(nonce);
  return timingSafeEqualStr(expectedSig, providedSig);
}

export function parseCookieHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

/**
 * Sets the CSRF cookie with strict SameSite, Path=/, and Secure in production.
 */
export function issueCsrfCookie(res: NextResponse, existingToken?: string | null): string {
  const { isProd } = getEnv();
  const token = isValidSignedCsrfToken(existingToken)
    ? existingToken
    : generateCsrfToken();

  res.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Read by same-origin JS to send in X-CSRF-Token header
    sameSite: "strict",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return token;
}

/**
 * Enforces defense-in-depth CSRF validation on all POST, PUT, PATCH, and DELETE requests:
 * 1. Rejects cross-site Fetch Metadata (`Sec-Fetch-Site: cross-site`)
 * 2. Validates `Origin` (or `Referer`) against the strict `ALLOWED_ORIGINS` allowlist
 * 3. Validates the submitted `X-CSRF-Token` header matches the `mcpic_csrf_token` cookie
 *    via constant-time comparison (`crypto.timingSafeEqual`)
 * 4. Verifies the token's server-side HMAC-SHA256 signature
 */
export function verifyCsrf(req: Request): { ok: true } | { ok: false; reason: string } {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return { ok: true };
  }

  const fetchSite = req.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite && fetchSite === "cross-site") {
    return { ok: false, reason: "Cross-site state-changing request blocked" };
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (origin) {
    try {
      const parsedOrigin = new URL(origin).origin;
      if (!isAllowedOrigin(parsedOrigin, req)) {
        return { ok: false, reason: "Untrusted request origin" };
      }
    } catch {
      return { ok: false, reason: "Malformed origin header" };
    }
  } else if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (!isAllowedOrigin(refOrigin, req)) {
        return { ok: false, reason: "Untrusted request referer" };
      }
    } catch {
      return { ok: false, reason: "Malformed referer header" };
    }
  } else {
    return { ok: false, reason: "Missing Origin/Referer header" };
  }

  const cookieToken = parseCookieHeader(req.headers.get("cookie"), CSRF_COOKIE_NAME);
  const headerToken = req.headers.get(CSRF_HEADER_NAME)?.trim();

  if (!cookieToken || !headerToken) {
    return { ok: false, reason: "Missing CSRF cookie or header token" };
  }

  if (!timingSafeEqualStr(cookieToken, headerToken)) {
    return { ok: false, reason: "CSRF token mismatch between header and cookie" };
  }

  if (!isValidSignedCsrfToken(cookieToken)) {
    return { ok: false, reason: "Invalid or forged CSRF token signature" };
  }

  return { ok: true };
}
