import { z } from "zod";
import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { jsonResponse } from "@/lib/security/guards";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { verifyWebhookSignature } from "@/lib/security/webhook";

const webhookEventSchema = z.object({
  event: z.string().min(1).max(100),
  deliveryId: z.string().min(1).max(120).optional(),
  data: z.record(z.unknown()).optional(),
});

/**
 * POST /api/webhooks
 * Verifies HMAC-SHA256 signature (`X-MCPIC-Signature: sha256=<hex>`) and
 * replay timestamp (`X-MCPIC-Timestamp: <unix_seconds>`) using constant-time comparison.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit("webhook", ip);
  if (!rl.allowed) {
    return jsonResponse(req, { error: "Rate limit exceeded" }, { status: 429 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-mcpic-signature");
  const timestamp = req.headers.get("x-mcpic-timestamp");

  const verification = verifyWebhookSignature(rawBody, signature, timestamp);
  if (!verification.valid) {
    logger.warn("Rejected webhook with invalid signature", { reason: verification.reason });
    return jsonResponse(req, { error: "Invalid webhook signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse(req, { error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = webhookEventSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonResponse(req, { error: "Malformed webhook event" }, { status: 400 });
  }

  try {
    await withDbContext({ role: "system" }, async (client) => {
      await writeAuditLog(client, {
        actorId: null,
        action: `webhook.${parsed.data.event}`,
        resourceType: "webhook",
        resourceId: parsed.data.deliveryId ?? null,
        metadata: { event: parsed.data.event },
      });
    });

    return jsonResponse(req, { received: true });
  } catch (err) {
    logger.error("Webhook processing error", { error: err });
    return jsonResponse(req, { error: "Webhook processing failed" }, { status: 500 });
  }
}
