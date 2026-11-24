import bcrypt from "bcryptjs";
import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { changePasswordSchema } from "@/lib/validators";

export async function PUT(req: Request) {
  const guard = await guardRequest(req, {
    auth: "authenticated",
    rateLimit: "auth",
    csrf: true,
  });
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const userId = guard.session!.user.id;
  const { currentPassword, newPassword } = parsed.data;

  try {
    const result = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query<{ password_hash: string }>(
        "SELECT password_hash FROM users WHERE id = $1 LIMIT 1",
        [userId]
      );
      const row = res.rows[0];
      if (!row) return "NOT_FOUND" as const;

      const matches = await bcrypt.compare(currentPassword, row.password_hash);
      if (!matches) return "WRONG_PASSWORD" as const;

      const newHash = await bcrypt.hash(newPassword, 12);
      await client.query(
        "UPDATE users SET password_hash = $1, token_version = token_version + 1 WHERE id = $2",
        [newHash, userId]
      );
      await writeAuditLog(client, {
        actorId: userId,
        action: "user.password_changed",
        resourceType: "user",
        resourceId: userId,
      });

      return "OK" as const;
    });

    if (result === "WRONG_PASSWORD") {
      return jsonResponse(req, { error: "Current password is incorrect" }, { status: 400 });
    }
    if (result === "NOT_FOUND") {
      return jsonResponse(req, { error: "User not found" }, { status: 404 });
    }

    return jsonResponse(req, {
      message: "Password updated. Please sign in again.",
    });
  } catch (err) {
    logger.error("Password change failed", { error: err });
    return jsonResponse(req, { error: "Failed to change password" }, { status: 500 });
  }
}
