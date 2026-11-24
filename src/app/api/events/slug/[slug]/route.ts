import { withDbContext } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: { params: { slug: string } }
) {
  const guard = await guardRequest(req, { auth: "none", csrf: false });
  if (!guard.ok) return guard.response;

  const slug = context.params.slug?.trim().toLowerCase();
  if (!slug || slug.length > 120) {
    return jsonResponse(req, { error: "Invalid event slug" }, { status: 400 });
  }

  try {
    const data = await withDbContext(guard.dbCtx, async (client) => {
      const eventRes = await client.query(
        `SELECT id, slug, name, description, image_url, start_date, end_date, created_by_name, created_at
         FROM events WHERE slug = $1 LIMIT 1`,
        [slug]
      );
      const event = eventRes.rows[0];
      if (!event) return null;

      const segRes = await client.query(
        `SELECT id, event_id, name, description, image_url, start_date, end_date, created_at
         FROM segments WHERE event_id = $1 ORDER BY created_at DESC`,
        [event.id]
      );

      return { event, segments: segRes.rows };
    });

    if (!data) {
      return jsonResponse(req, { error: "Event not found" }, { status: 404 });
    }

    return jsonResponse(req, data);
  } catch (err) {
    logger.error("Failed to fetch event by slug", { error: err });
    return jsonResponse(req, { error: "Failed to fetch event" }, { status: 500 });
  }
}
