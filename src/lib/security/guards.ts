import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth";
import type { DbContext } from "../db";
import { applyCorsHeaders, isAllowedOrigin } from "./cors";
import { verifyCsrf } from "./csrf";
import { checkRateLimit, getClientIp, type RateLimitBucket } from "./rate-limit";

export type AuthRequirement = "none" | "authenticated" | "verified" | "admin";

export interface GuardOptions {
  auth?: AuthRequirement;
  csrf?: boolean;
  rateLimit?: RateLimitBucket;
}

export interface GuardSuccess {
  ok: true;
  session: Session | null;
  dbCtx: DbContext;
  ip: string;
}

export interface GuardFailure {
  ok: false;
  response: NextResponse;
}

export function jsonResponse(
  req: Request,
  body: unknown,
  init?: ResponseInit
): NextResponse {
  const res = NextResponse.json(body, init);
  return applyCorsHeaders(req, res);
}

/**
 * Central server-side security guard enforcing:
 * 1. Strict CORS origin check
 * 2. Sliding-window rate limiting
 * 3. CSRF Origin/Referer + double-submit token verification (mutations)
 * 4. Server-side session & role enforcement + PostgreSQL RLS context construction
 */
export async function guardRequest(
  req: Request,
  options: GuardOptions = {}
): Promise<GuardSuccess | GuardFailure> {
  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Origin not allowed" }, { status: 403 }),
    };
  }

  const ip = getClientIp(req);

  if (options.rateLimit) {
    const rl = checkRateLimit(options.rateLimit, ip);
    if (!rl.allowed) {
      const res = jsonResponse(
        req,
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(rl.retryAfterSeconds));
      res.headers.set("X-RateLimit-Limit", String(rl.limit));
      res.headers.set("X-RateLimit-Remaining", "0");
      return { ok: false, response: res };
    }
  }

  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(req.method.toUpperCase());
  const requireCsrf = options.csrf ?? isMutation;
  if (requireCsrf) {
    const csrfCheck = verifyCsrf(req);
    if (!csrfCheck.ok) {
      return {
        ok: false,
        response: jsonResponse(req, { error: csrfCheck.reason }, { status: 403 }),
      };
    }
  }

  const authReq = options.auth ?? "none";
  if (authReq === "none") {
    return {
      ok: true,
      session: null,
      dbCtx: { userId: null, role: "anonymous" },
      ip,
    };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      ok: false,
      response: jsonResponse(req, { error: "Authentication required" }, { status: 401 }),
    };
  }

  if (authReq === "verified" && !session.user.emailVerified) {
    return {
      ok: false,
      response: jsonResponse(
        req,
        { error: "Please verify your email address from your dashboard profile first." },
        { status: 403 }
      ),
    };
  }

  if (authReq === "admin" && session.user.role !== "admin") {
    return {
      ok: false,
      response: jsonResponse(req, { error: "Admin privileges required" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    session,
    dbCtx: {
      userId: session.user.id,
      role: session.user.role,
    },
    ip,
  };
}
