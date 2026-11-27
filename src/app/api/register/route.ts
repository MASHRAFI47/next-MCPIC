import bcrypt from "bcryptjs";
import { withDbContext, writeAuditLog } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { sendMail } from "@/lib/mailer";
import { randomTokenHex, sha256Hex } from "@/lib/security/crypto";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { registerSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const guard = await guardRequest(req, { auth: "none", rateLimit: "register", csrf: true });
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { fullName, email, password, imageUrl } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);
  const rawToken = randomTokenHex(32);
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    const created = await withDbContext({ role: "system" }, async (client) => {
      const exists = await client.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [email]);
      if (exists.rowCount && exists.rowCount > 0) {
        return null;
      }

      const inserted = await client.query<{
        id: string;
        email: string;
        name: string;
        role: string;
      }>(
        `INSERT INTO users (email, name, image_url, password_hash, role, designation)
         VALUES ($1, $2, $3, $4, 'member', 'member')
         RETURNING id, email, name, role`,
        [email, fullName, imageUrl, passwordHash]
      );

      const user = inserted.rows[0];

      await client.query(
        `INSERT INTO verification_tokens (user_id, purpose, token_hash, expires_at)
         VALUES ($1, 'email_verify', $2, $3)`,
        [user.id, tokenHash, expiresAt]
      );

      await writeAuditLog(client, {
        actorId: user.id,
        action: "user.registered",
        resourceType: "user",
        resourceId: user.id,
      });

      return user;
    });

    if (!created) {
      return jsonResponse(
        req,
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const { nextAuthUrl, isProd } = getEnv();
    const verifyPath = `/verify-email?token=${encodeURIComponent(rawToken)}`;
    const verifyLink = `${nextAuthUrl}${verifyPath}`;

    const mailResult = await sendMail({
      to: email,
      subject: "Verify your MCPIC account",
      text: `Hello ${fullName},\n\nPlease verify your MCPIC email address by opening this link (valid for 24 hours):\n${verifyLink}\n\nIf you did not register, you can ignore this message.`,
    });

    return jsonResponse(
      req,
      {
        message: "Registration successful. Please verify your email.",
        user: created,
        ...(!isProd && !mailResult.delivered ? { devVerifyUrl: verifyPath } : {}),
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error("User registration failed", { error: err });
    return jsonResponse(req, { error: "Failed to register account" }, { status: 500 });
  }
}
