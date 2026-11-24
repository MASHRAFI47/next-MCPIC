import crypto from "node:crypto";
import { getEnv } from "../env";
import { timingSafeEqualStr } from "./crypto";

const MAX_REPLAY_WINDOW_SECONDS = 300; // 5 minutes

export interface WebhookVerifyResult {
  valid: boolean;
  reason?: string;
}

/**
 * Verifies an incoming webhook's HMAC-SHA256 signature and timestamp replay window.
 * Expected headers:
 *   X-MCPIC-Timestamp: <unix_seconds>
 *   X-MCPIC-Signature: sha256=<hex_digest_of "${timestamp}.${rawBody}">
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  timestampHeader: string | null
): WebhookVerifyResult {
  if (!signatureHeader || !timestampHeader) {
    return { valid: false, reason: "Missing webhook signature or timestamp headers" };
  }

  const ts = Number(timestampHeader);
  if (!Number.isInteger(ts) || ts <= 0) {
    return { valid: false, reason: "Invalid webhook timestamp" };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > MAX_REPLAY_WINDOW_SECONDS) {
    return { valid: false, reason: "Webhook timestamp outside allowed replay window" };
  }

  const prefix = "sha256=";
  if (!signatureHeader.startsWith(prefix)) {
    return { valid: false, reason: "Unsupported signature format" };
  }

  const providedHex = signatureHeader.slice(prefix.length).trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(providedHex)) {
    return { valid: false, reason: "Malformed signature digest" };
  }

  const { webhookSecret } = getEnv();
  const expectedHex = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${ts}.${rawBody}`)
    .digest("hex");

  if (!timingSafeEqualStr(expectedHex, providedHex)) {
    return { valid: false, reason: "Signature verification failed" };
  }

  return { valid: true };
}
