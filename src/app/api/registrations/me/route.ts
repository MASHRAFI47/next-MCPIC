import { withDbContext } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "authenticated", csrf: false });
  if (!guard.ok) return guard.response;

  try {
    const registrations = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `SELECT sr.id, sr.ticket_code, sr.segment_id, sr.participant_name, sr.email,
                sr.phone, sr.institution, sr.class_grade, sr.team_name, sr.team_members,
                sr.status, sr.created_at,
                s.name AS segment_name, e.name AS event_name, e.slug AS event_slug
         FROM segment_registrations sr
         JOIN segments s ON s.id = sr.segment_id
         JOIN events e ON e.id = s.event_id
         WHERE sr.user_id = $1
         ORDER BY sr.created_at DESC`,
        [guard.session!.user.id]
      );
      return res.rows;
    });

    return jsonResponse(req, registrations);
  } catch (err) {
    logger.error("Failed to fetch user registrations", { error: err });
    return jsonResponse(req, { error: "Failed to load your registrations" }, { status: 500 });
  }
}
