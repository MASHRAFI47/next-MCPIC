import bcrypt from "bcryptjs";
import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sha256Hex } from "@/lib/security/crypto";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { passwordResetConfirmSchema } from "@/lib/validators";

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

  const parsed = passwordResetConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const tokenHash = sha256Hex(parsed.data.token);
  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);

  try {
    const updated = await withDbContext({ role: "system" }, async (client) => {
      const res = await client.query<{ id: string; user_id: string }>(
        `SELECT id, user_id
         FROM verification_tokens
         WHERE token_hash = $1
           AND purpose = 'password_reset'
           AND used_at IS NULL
           AND expires_at > NOW()
         LIMIT 1`,
        [tokenHash]
      );

      const row = res.rows[0];
      if (!row) return false;

      await client.query("UPDATE verification_tokens SET used_at = NOW() WHERE id = $1", [row.id]);
      // Increment token_version to revoke all existing sessions immediately
      await client.query(
        `UPDATE users
         SET password_hash = $1, token_version = token_version + 1
         WHERE id = $2`,
        [newHash, row.user_id]
      );
      await writeAuditLog(client, {
        actorId: row.user_id,
        action: "auth.password_reset_completed",
        resourceType: "user",
        resourceId: row.user_id,
      });

      return true;
    });

    if (!updated) {
      return jsonResponse(
        req,
        { error: "Reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    return jsonResponse(req, {
      message: "Password updated successfully. Please sign in with your new password.",
    });
  } catch (err) {
    logger.error("Password reset confirm failed", { error: err });
    return jsonResponse(req, { error: "Failed to reset password" }, { status: 500 });
  }
}
