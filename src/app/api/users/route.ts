import { withDbContext } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "admin", csrf: false });
  if (!guard.ok) return guard.response;

  try {
    const users = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `SELECT id, email, name, image_url, role, designation,
                email_verified_at, mfa_enabled, created_at
         FROM users
         ORDER BY created_at DESC`
      );
      return res.rows;
    });

    return jsonResponse(req, users);
  } catch (err) {
    logger.error("Failed to list users", { error: err });
    return jsonResponse(req, { error: "Failed to load users" }, { status: 500 });
  }
}
