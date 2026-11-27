import { withDbContext } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "admin", csrf: false });
  if (!guard.ok) return guard.response;

  try {
    const stats = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query<{
        users_count: number;
        events_count: number;
        blogs_count: number;
        recruit_form_count: number;
      }>(`
        SELECT
          (SELECT COUNT(*)::int FROM users) AS users_count,
          (SELECT COUNT(*)::int FROM events) AS events_count,
          (SELECT COUNT(*)::int FROM blogs) AS blogs_count,
          (SELECT COUNT(*)::int FROM executive_applications) AS recruit_form_count
      `);
      const row = res.rows[0];
      return {
        usersCount: row?.users_count ?? 0,
        eventsCount: row?.events_count ?? 0,
        blogsCount: row?.blogs_count ?? 0,
        recruitFormCount: row?.recruit_form_count ?? 0,
      };
    });

    return jsonResponse(req, stats);
  } catch (err) {
    logger.error("Failed to load admin stats", { error: err });
    return jsonResponse(req, { error: "Failed to load statistics" }, { status: 500 });
  }
}
