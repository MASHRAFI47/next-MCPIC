import { withDbContext } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "admin", csrf: false });
  if (!guard.ok) return guard.response;

  try {
    const stats = await withDbContext(guard.dbCtx, async (client) => {
      const [users, events, blogs, forms] = await Promise.all([
        client.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users"),
        client.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM events"),
        client.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM blogs"),
        client.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM executive_applications"),
      ]);

      return {
        usersCount: Number(users.rows[0]?.count ?? 0),
        eventsCount: Number(events.rows[0]?.count ?? 0),
        blogsCount: Number(blogs.rows[0]?.count ?? 0),
        recruitFormCount: Number(forms.rows[0]?.count ?? 0),
      };
    });

    return jsonResponse(req, stats);
  } catch (err) {
    logger.error("Failed to load admin stats", { error: err });
    return jsonResponse(req, { error: "Failed to load statistics" }, { status: 500 });
  }
}
