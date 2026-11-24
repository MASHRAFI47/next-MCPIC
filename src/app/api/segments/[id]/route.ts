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
    const segment = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `SELECT s.id, s.event_id, e.name AS event_name, e.slug AS event_slug,
                s.name, s.description, s.image_url, s.start_date, s.end_date, s.created_at, s.updated_at
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

  const { eventId, name, description, imageUrl, startDate, endDate } = parsed.data;

  try {
    const updated = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `UPDATE segments
         SET event_id = $1, name = $2, description = $3, image_url = $4, start_date = $5, end_date = $6
         WHERE id = $7
         RETURNING id, event_id, name, description, image_url, start_date, end_date, updated_at`,
        [eventId, name, description, imageUrl, startDate, endDate, parsedId.data]
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
