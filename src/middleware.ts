import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_DASHBOARD_PREFIXES = [
  "/dashboard/manage-users",
  "/dashboard/add-event",
  "/dashboard/all-events",
  "/dashboard/all-event-segments",
  "/dashboard/add-event-segment",
  "/dashboard/update-event-segment",
  "/dashboard/segment-registrations",
  "/dashboard/add-blog",
  "/dashboard/all-blogs",
  "/dashboard/update-blog",
  "/dashboard/recruit",
  "/dashboard/messages",
  "/dashboard/audit-logs",
  "/dashboard/manage-executives",
  "/dashboard/manage-achievements",
];

function getAllowedOrigins(): string[] {
  const fallback = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
  const raw = process.env.ALLOWED_ORIGINS || fallback;
  return raw
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter((o) => o.length > 0 && o !== "*");
}

function isDevSameOriginLocalhost(origin: string, req: NextRequest): boolean {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:") return false;
    if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      return false;
    }
    const hostHeader = (req.headers.get("host") || req.nextUrl.host).trim().toLowerCase();
    return Boolean(hostHeader) && url.host.toLowerCase() === hostHeader;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Strict CORS enforcement on /api/*
  if (pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");
    if (origin) {
      const allowed = getAllowedOrigins();
      const normalized = origin.replace(/\/+$/, "");
      if (!allowed.includes(normalized) && !isDevSameOriginLocalhost(normalized, req)) {
        return NextResponse.json({ error: "CORS origin forbidden" }, { status: 403 });
      }
      if (req.method === "OPTIONS") {
        return new NextResponse(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-CSRF-Token",
            Vary: "Origin",
          },
        });
      }
    }
    return NextResponse.next();
  }

  // 2. Protected UI routes (server-side session + role gate)
  const isDashboard = pathname.startsWith("/dashboard");
  const isApplyRoute = pathname.startsWith("/apply-for-executive");

  if (isDashboard || isApplyRoute) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.invalidated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isAdminRoute = ADMIN_DASHBOARD_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );
    if (isAdminRoute && token.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/apply-for-executive/:path*"],
};
