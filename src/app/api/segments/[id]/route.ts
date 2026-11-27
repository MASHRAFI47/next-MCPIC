import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { updateSegmentSchema, uuidSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const guard = await guardRequest(req, { auth: "none", csrf: false });
  if (!guard.ok) return guard.response;

  const parsedId = uuidSchema.safeParse(context.params.id);
  if (!parsedId.success) {
    return jsonResponse(req, { error: "Invalid segment ID" }, { status: 400 });
  }

  try {
    // Use system context strictly to compute aggregate confirmed seat count without leaking PII
    const segment = await withDbContext({ role: "system" }, async (client) => {
      const res = await client.query(
        `SELECT s.id, s.event_id, e.name AS event_name, e.slug AS event_slug,
                s.name, s.description, s.image_url, s.start_date, s.end_date,
                s.registration_open, s.registration_deadline, s.max_participants,
                s.is_team_based, s.max_team_size, s.created_at, s.updated_at,
                (SELECT COUNT(*)::int FROM segment_registrations sr
                 WHERE sr.segment_id = s.id AND sr.status = 'confirmed') AS confirmed_count
         FROM segments s
         JOIN events e ON e.id = s.event_id
         WHERE s.id = $1
         LIMIT 1`,
        [parsedId.data]
      );
      return res.rows[0] ?? null;
    });

    if (!segment) {
      return jsonResponse(req, { error: "Segment not found" }, { status: 404 });
    }

    return jsonResponse(req, segment);
  } catch (err) {
    logger.error("Failed to fetch segment", { error: err });
    return jsonResponse(req, { error: "Failed to fetch segment" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: { id: string } }
) {
  const guard = await guardRequest(req, {
    auth: "admin",
    rateLimit: "write",
    csrf: true,
  });
  if (!guard.ok) return guard.response;

  const parsedId = uuidSchema.safeParse(context.params.id);
  if (!parsedId.success) {
    return jsonResponse(req, { error: "Invalid segment ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSegmentSchema.safeParse(body);
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
    const updated = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `UPDATE segments
         SET event_id = $1, name = $2, description = $3, image_url = $4,
             start_date = $5, end_date = $6, registration_open = $7,
             registration_deadline = $8, max_participants = $9,
             is_team_based = $10, max_team_size = $11
         WHERE id = $12
         RETURNING id, event_id, name, description, image_url, start_date, end_date,
                   registration_open, registration_deadline, max_participants,
                   is_team_based, max_team_size, updated_at`,
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
          parsedId.data,
        ]
      );
      const row = res.rows[0];
      if (!row) return null;

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "segment.updated",
        resourceType: "segment",
        resourceId: row.id,
      });

      return row;
    });

    if (!updated) {
      return jsonResponse(req, { error: "Segment not found" }, { status: 404 });
    }

    return jsonResponse(req, updated);
  } catch (err) {
    logger.error("Failed to update segment", { error: err });
    return jsonResponse(req, { error: "Failed to update segment" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  const guard = await guardRequest(req, {
    auth: "admin",
    rateLimit: "write",
    csrf: true,
  });
  if (!guard.ok) return guard.response;

  const parsedId = uuidSchema.safeParse(context.params.id);
  if (!parsedId.success) {
    return jsonResponse(req, { error: "Invalid segment ID" }, { status: 400 });
  }

  try {
    const deleted = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        "DELETE FROM segments WHERE id = $1 RETURNING id, name",
        [parsedId.data]
      );
      const row = res.rows[0];
      if (!row) return null;

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "segment.deleted",
        resourceType: "segment",
        resourceId: row.id,
        metadata: { name: row.name },
      });

      return row;
    });

    if (!deleted) {
      return jsonResponse(req, { error: "Segment not found" }, { status: 404 });
    }

    return jsonResponse(req, { deleted: true, id: deleted.id });
  } catch (err) {
    logger.error("Failed to delete segment", { error: err });
    return jsonResponse(req, { error: "Failed to delete segment" }, { status: 500 });
  }
}
