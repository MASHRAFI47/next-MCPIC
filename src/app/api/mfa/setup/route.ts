import QRCode from "qrcode";
import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { encryptSecret } from "@/lib/security/crypto";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { buildOtpAuthUri, generateTotpSecret } from "@/lib/security/totp";

/**
 * POST /api/mfa/setup
 * Generates a new TOTP secret, stores it encrypted at rest (mfa_enabled stays false
 * until confirmed via /api/mfa/verify), and returns QR code data URL + manual secret.
 */
export async function POST(req: Request) {
  const guard = await guardRequest(req, {
    auth: "authenticated",
    rateLimit: "mfa",
    csrf: true,
  });
  if (!guard.ok) return guard.response;

  const user = guard.session!.user;
  if (user.mfaEnabled) {
    return jsonResponse(req, { error: "MFA is already enabled on this account." }, { status: 400 });
  }

  try {
    const secret = generateTotpSecret();
    const encrypted = encryptSecret(secret);
    const otpauthUri = buildOtpAuthUri(user.email, secret, "MCPIC");
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, { width: 220, margin: 2 });

    await withDbContext(guard.dbCtx, async (client) => {
      await client.query(
        "UPDATE users SET mfa_secret_enc = $1, mfa_enabled = FALSE WHERE id = $2",
        [encrypted, user.id]
      );
      await writeAuditLog(client, {
        actorId: user.id,
        action: "mfa.setup_initiated",
        resourceType: "user",
        resourceId: user.id,
      });
    });

    return jsonResponse(req, {
      qrCodeDataUrl,
      manualSecret: secret,
    });
  } catch (err) {
    logger.error("MFA setup failed", { error: err });
    return jsonResponse(req, { error: "Failed to initialize MFA setup" }, { status: 500 });
  }
}
