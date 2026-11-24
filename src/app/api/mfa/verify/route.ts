import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { decryptSecret } from "@/lib/security/crypto";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { generateRecoveryCodes, hashRecoveryCode, verifyTotpCode } from "@/lib/security/totp";
import { mfaVerifySchema } from "@/lib/validators";

/**
 * POST /api/mfa/verify
 * Confirms the user's first 6-digit TOTP code, enables MFA, and returns 8 single-use
 * recovery codes (stored only as SHA-256 hashes in PostgreSQL).
 */
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

  const parsed = mfaVerifySchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid TOTP code" },
      { status: 400 }
    );
  }

  const userId = guard.session!.user.id;

  try {
    const recoveryCodes = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query<{ mfa_secret_enc: string | null; mfa_enabled: boolean }>(
        "SELECT mfa_secret_enc, mfa_enabled FROM users WHERE id = $1 LIMIT 1",
        [userId]
      );
      const row = res.rows[0];
      if (!row || !row.mfa_secret_enc) return "NO_SETUP" as const;
      if (row.mfa_enabled) return "ALREADY_ENABLED" as const;

      const secret = decryptSecret(row.mfa_secret_enc);
      if (!verifyTotpCode(secret, parsed.data.code)) {
        return "INVALID_CODE" as const;
      }

      const codes = generateRecoveryCodes(8);
      const hashes = codes.map(hashRecoveryCode);

      await client.query(
        "UPDATE users SET mfa_enabled = TRUE, mfa_recovery_hashes = $1 WHERE id = $2",
        [hashes, userId]
      );
      await writeAuditLog(client, {
        actorId: userId,
        action: "mfa.enabled",
        resourceType: "user",
        resourceId: userId,
      });

      return codes;
    });

    if (recoveryCodes === "NO_SETUP") {
      return jsonResponse(req, { error: "Run MFA setup first." }, { status: 400 });
    }
    if (recoveryCodes === "ALREADY_ENABLED") {
      return jsonResponse(req, { error: "MFA is already enabled." }, { status: 400 });
    }
    if (recoveryCodes === "INVALID_CODE") {
      return jsonResponse(req, { error: "Invalid authenticator code. Please try again." }, { status: 400 });
    }

    return jsonResponse(req, {
      message: "Multi-Factor Authentication enabled. Save these recovery codes safely!",
      recoveryCodes,
    });
  } catch (err) {
    logger.error("MFA verification failed", { error: err });
    return jsonResponse(req, { error: "Failed to verify MFA" }, { status: 500 });
  }
}
