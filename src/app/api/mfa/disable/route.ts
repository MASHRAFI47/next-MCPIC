import bcrypt from "bcryptjs";
import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { decryptSecret } from "@/lib/security/crypto";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { matchRecoveryCode, verifyTotpCode } from "@/lib/security/totp";
import { mfaDisableSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const guard = await guardRequest(req, {
    auth: "authenticated",
    rateLimit: "mfa",
    csrf: true,
  });
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = mfaDisableSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Password and code are required" },
      { status: 400 }
    );
  }

  const userId = guard.session!.user.id;
  const { password, code } = parsed.data;

  try {
    const status = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query<{
        password_hash: string;
        mfa_enabled: boolean;
        mfa_secret_enc: string | null;
        mfa_recovery_hashes: string[];
      }>(
        `SELECT password_hash, mfa_enabled, mfa_secret_enc, mfa_recovery_hashes
         FROM users WHERE id = $1 LIMIT 1`,
        [userId]
      );
      const row = res.rows[0];
      if (!row || !row.mfa_enabled) return "NOT_ENABLED" as const;

      const passOk = await bcrypt.compare(password, row.password_hash);
      if (!passOk) return "WRONG_PASSWORD" as const;

      let codeOk = false;
      if (row.mfa_secret_enc) {
        const secret = decryptSecret(row.mfa_secret_enc);
        codeOk = verifyTotpCode(secret, code);
      }
      if (!codeOk && matchRecoveryCode(code, row.mfa_recovery_hashes) !== -1) {
        codeOk = true;
      }
      if (!codeOk) return "INVALID_CODE" as const;

      await client.query(
        `UPDATE users
         SET mfa_enabled = FALSE,
             mfa_secret_enc = NULL,
             mfa_recovery_hashes = ARRAY[]::TEXT[]
         WHERE id = $1`,
        [userId]
      );
      await writeAuditLog(client, {
        actorId: userId,
        action: "mfa.disabled",
        resourceType: "user",
        resourceId: userId,
      });

      return "OK" as const;
    });

    if (status === "NOT_ENABLED") {
      return jsonResponse(req, { error: "MFA is not enabled." }, { status: 400 });
    }
    if (status === "WRONG_PASSWORD") {
      return jsonResponse(req, { error: "Password is incorrect." }, { status: 400 });
    }
    if (status === "INVALID_CODE") {
      return jsonResponse(req, { error: "Invalid authenticator or recovery code." }, { status: 400 });
    }

    return jsonResponse(req, { message: "Multi-Factor Authentication disabled." });
  } catch (err) {
    logger.error("MFA disable failed", { error: err });
    return jsonResponse(req, { error: "Failed to disable MFA" }, { status: 500 });
  }
}
