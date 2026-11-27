import { withDbContext } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = new Set(["unread", "read", "resolved"]);

export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "admin", csrf: false });
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status")?.trim();
  const filterStatus = status && ALLOWED_STATUSES.has(status) ? status : null;

  try {
    const messages = await withDbContext(guard.dbCtx, async (client) => {
      if (filterStatus) {
        const res = await client.query(
          `SELECT id, name, email, message, status, created_at
           FROM contact_messages
           WHERE status = $1
           ORDER BY created_at DESC
           LIMIT 200`,
          [filterStatus]
        );
        return res.rows;
      }

      const res = await client.query(
        `SELECT id, name, email, message, status, created_at
         FROM contact_messages
         ORDER BY created_at DESC
         LIMIT 200`
      );
      return res.rows;
    });

    return jsonResponse(req, messages);
  } catch (err) {
    logger.error("Failed to fetch contact messages", { error: err });
    return jsonResponse(req, { error: "Failed to load messages" }, { status: 500 });
  }
}
