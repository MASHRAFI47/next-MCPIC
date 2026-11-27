import { z } from "zod";
import { withDbContext, writeAuditLog } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { sendMail } from "@/lib/mailer";
import { randomTokenHex, sha256Hex } from "@/lib/security/crypto";
import { guardRequest, jsonResponse } from "@/lib/security/guards";

const confirmSchema = z.object({
  token: z.string().trim().min(32).max(128),
});

/**
 * POST /api/verify-email — Re-send verification email for the currently signed-in user.
 */
export async function POST(req: Request) {
  const guard = await guardRequest(req, {
    auth: "authenticated",
    rateLimit: "passwordReset",
    csrf: true,
  });
  if (!guard.ok) return guard.response;

  const user = guard.session!.user;
  if (user.emailVerified) {
    return jsonResponse(req, { message: "Email is already verified." });
  }

  const rawToken = randomTokenHex(32);
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    await withDbContext({ role: "system" }, async (client) => {
      await client.query(
        `DELETE FROM verification_tokens
         WHERE user_id = $1 AND purpose = 'email_verify' AND used_at IS NULL`,
        [user.id]
      );
      await client.query(
        `INSERT INTO verification_tokens (user_id, purpose, token_hash, expires_at)
         VALUES ($1, 'email_verify', $2, $3)`,
        [user.id, tokenHash, expiresAt]
      );
    });

    const { nextAuthUrl, isProd } = getEnv();
    const verifyPath = `/verify-email?token=${encodeURIComponent(rawToken)}`;
    const verifyLink = `${nextAuthUrl}${verifyPath}`;
    const mailResult = await sendMail({
      to: user.email,
      subject: "Verify your MCPIC account",
      text: `Hello ${user.name},\n\nVerify your MCPIC email address:\n${verifyLink}\n\nThis link expires in 24 hours.`,
    });

    return jsonResponse(req, {
      message: "Verification email sent.",
      ...(!isProd && !mailResult.delivered ? { devVerifyUrl: verifyPath } : {}),
    });
  } catch (err) {
    logger.error("Failed to send verification email", { error: err });
    return jsonResponse(req, { error: "Failed to send verification email" }, { status: 500 });
  }
}

/**
 * PUT /api/verify-email — Confirm an email verification token.
 */
export async function PUT(req: Request) {
  const guard = await guardRequest(req, { auth: "none", rateLimit: "auth", csrf: true });
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(req, { error: "Invalid verification token" }, { status: 400 });
  }

  const tokenHash = sha256Hex(parsed.data.token);

  try {
    const ok = await withDbContext({ role: "system" }, async (client) => {
      const res = await client.query<{ id: string; user_id: string }>(
        `SELECT id, user_id
         FROM verification_tokens
         WHERE token_hash = $1
           AND purpose = 'email_verify'
           AND used_at IS NULL
           AND expires_at > NOW()
         LIMIT 1`,
        [tokenHash]
      );

      const row = res.rows[0];
      if (!row) return false;

      await client.query("UPDATE verification_tokens SET used_at = NOW() WHERE id = $1", [row.id]);
      await client.query(
        "UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = $1",
        [row.user_id]
      );
      await writeAuditLog(client, {
        actorId: row.user_id,
        action: "user.email_verified",
        resourceType: "user",
        resourceId: row.user_id,
      });

      return true;
    });

    if (!ok) {
      return jsonResponse(
        req,
        { error: "Verification link is invalid or has expired." },
        { status: 400 }
      );
    }

    return jsonResponse(req, { message: "Email verified successfully." });
  } catch (err) {
    logger.error("Email verification failed", { error: err });
    return jsonResponse(req, { error: "Verification failed" }, { status: 500 });
  }
}
