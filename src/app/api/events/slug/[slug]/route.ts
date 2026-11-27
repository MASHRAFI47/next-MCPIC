import { queryPublic } from "@/lib/db";
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
    // Single 1-round-trip SQL query returning the event + its segments as JSON
    const rows = await queryPublic<{
      event: Record<string, unknown>;
      segments: Record<string, unknown>[];
    }>(
      `SELECT
         json_build_object(
           'id', e.id,
           'slug', e.slug,
           'name', e.name,
           'description', e.description,
           'image_url', e.image_url,
           'start_date', e.start_date,
           'end_date', e.end_date,
           'created_by_name', e.created_by_name,
           'created_at', e.created_at
         ) AS event,
         COALESCE(
           (
             SELECT json_agg(
               json_build_object(
                 'id', s.id,
                 'event_id', s.event_id,
                 'name', s.name,
                 'description', s.description,
                 'image_url', s.image_url,
                 'start_date', s.start_date,
                 'end_date', s.end_date,
                 'created_at', s.created_at
               )
               ORDER BY s.created_at DESC
             )
             FROM segments s
             WHERE s.event_id = e.id
           ),
           '[]'::json
         ) AS segments
       FROM events e
       WHERE e.slug = $1
       LIMIT 1`,
      [slug]
    );

    const data = rows[0] ?? null;
    if (!data) {
      return jsonResponse(req, { error: "Event not found" }, { status: 404 });
    }

    const res = jsonResponse(req, data);
    res.headers.set("Cache-Control", "public, max-age=15, stale-while-revalidate=60");
    return res;
  } catch (err) {
    logger.error("Failed to fetch event by slug", { error: err });
    return jsonResponse(req, { error: "Failed to fetch event" }, { status: 500 });
  }
}
