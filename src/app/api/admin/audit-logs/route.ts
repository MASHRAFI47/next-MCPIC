import { withDbContext } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "admin", csrf: false });
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const actionPrefix = (url.searchParams.get("action") || "").trim().slice(0, 60);
  const limitRaw = Number(url.searchParams.get("limit") || "100");
  const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 100;

  try {
    const logs = await withDbContext(guard.dbCtx, async (client) => {
      if (actionPrefix) {
        const res = await client.query(
          `SELECT a.id, a.actor_id, u.name AS actor_name, u.email AS actor_email,
                  a.action, a.resource_type, a.resource_id, a.metadata, a.created_at
           FROM audit_logs a
           LEFT JOIN users u ON u.id = a.actor_id
           WHERE a.action ILIKE $1
           ORDER BY a.created_at DESC
           LIMIT $2`,
          [`${actionPrefix}%`, limit]
        );
        return res.rows;
      }

      const res = await client.query(
        `SELECT a.id, a.actor_id, u.name AS actor_name, u.email AS actor_email,
                a.action, a.resource_type, a.resource_id, a.metadata, a.created_at
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.actor_id
         ORDER BY a.created_at DESC
         LIMIT $1`,
        [limit]
      );
      return res.rows;
    });

    return jsonResponse(req, logs);
  } catch (err) {
    logger.error("Failed to fetch audit logs", { error: err });
    return jsonResponse(req, { error: "Failed to load audit logs" }, { status: 500 });
  }
}
