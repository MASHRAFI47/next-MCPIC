import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { createSegmentSchema, uuidSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "none", csrf: false });
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const eventIdParam = url.searchParams.get("eventId");

  if (eventIdParam) {
    const validId = uuidSchema.safeParse(eventIdParam);
    if (!validId.success) {
      return jsonResponse(req, { error: "Invalid eventId parameter" }, { status: 400 });
    }
  }

  try {
    const segments = await withDbContext(guard.dbCtx, async (client) => {
      const baseQuery = `
        SELECT s.id, s.event_id, e.name AS event_name, e.slug AS event_slug,
               s.name, s.description, s.image_url, s.start_date, s.end_date,
               s.registration_open, s.registration_deadline, s.max_participants,
               s.is_team_based, s.max_team_size, s.created_at
        FROM segments s
        JOIN events e ON e.id = s.event_id
      `;
      if (eventIdParam) {
        const res = await client.query(
          `${baseQuery} WHERE s.event_id = $1 ORDER BY s.created_at DESC`,
          [eventIdParam]
        );
        return res.rows;
      }

      const res = await client.query(`${baseQuery} ORDER BY s.created_at DESC`);
      return res.rows;
    });

    return jsonResponse(req, segments);
  } catch (err) {
    logger.error("Failed to fetch segments", { error: err });
    return jsonResponse(req, { error: "Failed to fetch segments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await guardRequest(req, {
    auth: "admin",
    rateLimit: "write",
    csrf: true,
  });
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSegmentSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid segment payload" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const deadline = d.registrationDeadline instanceof Date ? d.registrationDeadline : null;
  const maxParticipants = typeof d.maxParticipants === "number" ? d.maxParticipants : null;
  const maxTeamSize = d.isTeamBased ? Math.max(2, d.maxTeamSize) : 1;

  try {
    const created = await withDbContext(guard.dbCtx, async (client) => {
      const eventCheck = await client.query("SELECT id FROM events WHERE id = $1 LIMIT 1", [d.eventId]);
      if (!eventCheck.rowCount) return null;

      const res = await client.query(
        `INSERT INTO segments
           (event_id, name, description, image_url, start_date, end_date,
            registration_open, registration_deadline, max_participants, is_team_based, max_team_size)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, event_id, name, description, image_url, start_date, end_date,
                   registration_open, registration_deadline, max_participants, is_team_based, max_team_size, created_at`,
        [
          d.eventId,
          d.name,
          d.description,
          d.imageUrl,
          d.startDate,
          d.endDate,
          d.registrationOpen,
          deadline,
          maxParticipants,
          d.isTeamBased,
          maxTeamSize,
        ]
      );

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "segment.created",
        resourceType: "segment",
        resourceId: res.rows[0].id,
        metadata: { eventId: d.eventId, name: d.name },
      });

      return res.rows[0];
    });

    if (!created) {
      return jsonResponse(req, { error: "Selected event does not exist" }, { status: 404 });
    }

    return jsonResponse(req, created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create segment", { error: err });
    return jsonResponse(req, { error: "Failed to create segment" }, { status: 500 });
  }
}
