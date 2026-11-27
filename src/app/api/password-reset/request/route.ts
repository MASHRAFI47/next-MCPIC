import { withDbContext, writeAuditLog } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { sendMail } from "@/lib/mailer";
import { randomTokenHex, sha256Hex } from "@/lib/security/crypto";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { passwordResetRequestSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const guard = await guardRequest(req, {
    auth: "none",
    rateLimit: "passwordReset",
    csrf: true,
  });
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = passwordResetRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(req, { error: "Valid email is required" }, { status: 400 });
  }

  const { email } = parsed.data;
  const genericMessage =
    "If an account exists for that email, a password reset link has been sent.";

  try {
    const rawToken = randomTokenHex(32);
    const tokenHash = sha256Hex(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const user = await withDbContext({ role: "system" }, async (client) => {
      const res = await client.query<{ id: string; name: string }>(
        "SELECT id, name FROM users WHERE email = $1 LIMIT 1",
        [email]
      );
      const found = res.rows[0];
      if (!found) return null;

      await client.query(
        `DELETE FROM verification_tokens
         WHERE user_id = $1 AND purpose = 'password_reset' AND used_at IS NULL`,
        [found.id]
      );
      await client.query(
        `INSERT INTO verification_tokens (user_id, purpose, token_hash, expires_at)
         VALUES ($1, 'password_reset', $2, $3)`,
        [found.id, tokenHash, expiresAt]
      );
      await writeAuditLog(client, {
        actorId: found.id,
        action: "auth.password_reset_requested",
        resourceType: "user",
        resourceId: found.id,
      });

      return found;
    });

    if (user) {
      const { nextAuthUrl, isProd } = getEnv();
      const resetPath = `/reset-password?token=${encodeURIComponent(rawToken)}`;
      const resetLink = `${nextAuthUrl}${resetPath}`;
      const mailResult = await sendMail({
        to: email,
        subject: "MCPIC Password Reset",
        text: `Hello ${user.name},\n\nReset your MCPIC password using this link (valid for 1 hour):\n${resetLink}\n\nIf you did not request this, ignore this email.`,
      });

      if (!isProd && !mailResult.delivered) {
        return jsonResponse(req, { message: genericMessage, devResetUrl: resetPath });
      }
    }

    return jsonResponse(req, { message: genericMessage });
  } catch (err) {
    logger.error("Password reset request failed", { error: err });
    return jsonResponse(req, { error: "Could not process request" }, { status: 500 });
  }
}
