const INSECURE_PLACEHOLDERS = new Set([
  "secret",
  "changeme",
  "change_me",
  "default",
  "password",
  "test",
  "123456",
  "REPLACE_WITH_64_HEX_CHARS_FROM_OPENSSL_RAND_HEX_32",
]);

function assertStrongSecret(name: string, value: string | undefined, minLen = 32): string {
  const trimmed = (value ?? "").trim();
  const isProd = process.env.NODE_ENV === "production";

  if (!trimmed || INSECURE_PLACEHOLDERS.has(trimmed)) {
    if (isProd) {
      throw new Error(`Missing or insecure ${name} environment variable in production.`);
    }
    // Deterministic dev-only fallback derived strictly for local dev when unconfigured
    return `dev-only-${name}-placeholder-never-use-in-production-000000000000`;
  }

  if (trimmed.length < minLen && isProd) {
    throw new Error(`${name} must be at least ${minLen} characters in production.`);
  }

  return trimmed;
}

export function getEnv() {
  const nextAuthUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
  const allowedOriginsRaw = process.env.ALLOWED_ORIGINS || nextAuthUrl;
  const allowedOrigins = allowedOriginsRaw
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter((o) => o.length > 0 && o !== "*");

  return {
    nodeEnv: process.env.NODE_ENV || "development",
    isProd: process.env.NODE_ENV === "production",
    nextAuthUrl,
    allowedOrigins,
    nextAuthSecret: assertStrongSecret("NEXTAUTH_SECRET", process.env.NEXTAUTH_SECRET, 32),
    mfaEncryptionKey: assertStrongSecret("MFA_ENCRYPTION_KEY", process.env.MFA_ENCRYPTION_KEY, 32),
    webhookSecret: assertStrongSecret("WEBHOOK_SECRET", process.env.WEBHOOK_SECRET, 32),
    databaseUrl: process.env.DATABASE_URL || "",
    imgbbApiKey: (process.env.IMGBB_API_KEY || "").trim(),
    smtp: {
      host: (process.env.SMTP_HOST || "").trim(),
      port: Number(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      user: (process.env.SMTP_USER || "").trim(),
      pass: (process.env.SMTP_PASS || "").trim(),
      from: (process.env.SMTP_FROM || "MCPIC <noreply@mcpscictclub.com>").trim(),
      contactReceiver: (process.env.CONTACT_RECEIVER_EMAIL || "contact@mcpscictclub.com").trim(),
    },
  };
}
