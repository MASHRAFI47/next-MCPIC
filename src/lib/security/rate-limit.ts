export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, max: 12 },
  register: { windowMs: 60 * 60 * 1000, max: 6 },
  mfa: { windowMs: 15 * 60 * 1000, max: 8 },
  passwordReset: { windowMs: 60 * 60 * 1000, max: 5 },
  upload: { windowMs: 15 * 60 * 1000, max: 20 },
  contact: { windowMs: 15 * 60 * 1000, max: 5 },
  write: { windowMs: 60 * 1000, max: 60 },
  webhook: { windowMs: 60 * 1000, max: 120 },
} as const satisfies Record<string, RateLimitConfig>;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

interface BucketEntry {
  timestamps: number[];
}

declare global {
  // eslint-disable-next-line no-var
  var __mcpicRateLimitStore: Map<string, BucketEntry> | undefined;
}

function getStore(): Map<string, BucketEntry> {
  if (!global.__mcpicRateLimitStore) {
    global.__mcpicRateLimitStore = new Map();
  }
  return global.__mcpicRateLimitStore;
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "127.0.0.1";
}

export function checkRateLimit(bucket: RateLimitBucket, identifier: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
} {
  const cfg = RATE_LIMITS[bucket];
  const now = Date.now();
  const windowStart = now - cfg.windowMs;
  const key = `${bucket}:${identifier}`;
  const store = getStore();

  // Periodic cleanup to avoid unbounded memory growth
  if (store.size > 5000) {
    for (const [k, entry] of store.entries()) {
      const fresh = entry.timestamps.filter((t) => t > windowStart);
      if (fresh.length === 0) store.delete(k);
      else entry.timestamps = fresh;
    }
  }

  const entry = store.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= cfg.max) {
    const oldest = entry.timestamps[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + cfg.windowMs - now) / 1000));
    store.set(key, entry);
    return { allowed: false, remaining: 0, retryAfterSeconds, limit: cfg.max };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return {
    allowed: true,
    remaining: Math.max(0, cfg.max - entry.timestamps.length),
    retryAfterSeconds: 0,
    limit: cfg.max,
  };
}
