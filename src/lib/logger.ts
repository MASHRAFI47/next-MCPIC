const REDACTED_KEYS = new Set([
  "password",
  "passwordhash",
  "password_hash",
  "currentpassword",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "secret",
  "mfa_secret_enc",
  "mfasecret",
  "totp",
  "totpcode",
  "recoverycodes",
  "mfa_recovery_hashes",
  "authorization",
  "cookie",
  "set-cookie",
  "apikey",
  "api_key",
  "imgbb_api_key",
  "database_url",
]);

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[TRUNCATED]";
  if (value === null || value === undefined) return value;
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (REDACTED_KEYS.has(key.toLowerCase())) {
        out[key] = "[REDACTED]";
      } else {
        out[key] = sanitizeValue(val, depth + 1);
      }
    }
    return out;
  }
  return value;
}

type LogLevel = "info" | "warn" | "error";

function writeLog(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta: sanitizeValue(meta) } : {}),
  };
  const serialized = JSON.stringify(entry);
  if (level === "error") {
    console.error(serialized);
  } else if (level === "warn") {
    console.warn(serialized);
  } else {
    console.info(serialized);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => writeLog("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => writeLog("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => writeLog("error", message, meta),
};
