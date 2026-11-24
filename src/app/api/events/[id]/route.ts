import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { uuidSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const guard = await guardRequest(req, { auth: "none", csrf: false });
  if (!guard.ok) return guard.response;

  const parsedId = uuidSchema.safeParse(context.params.id);
  if (!parsedId.success) {
    return jsonResponse(req, { error: "Invalid event ID" }, { status: 400 });
  }

  try {
    const data = await withDbContext(guard.dbCtx, async (client) => {
      const eventRes = await client.query(
        `SELECT id, slug, name, description, image_url, start_date, end_date, created_by_name, created_at
         FROM events WHERE id = $1 LIMIT 1`,
        [parsedId.data]
      );
      const event = eventRes.rows[0];
      if (!event) return null;

      const segRes = await client.query(
        `SELECT id, event_id, name, description, image_url, start_date, end_date, created_at
         FROM segments WHERE event_id = $1 ORDER BY created_at DESC`,
        [event.id]
      );

      return { ...event, segments: segRes.rows };
    });

    if (!data) {
      return jsonResponse(req, { error: "Event not found" }, { status: 404 });
    }

    return jsonResponse(req, data);
  } catch (err) {
    logger.error("Failed to fetch event by ID", { error: err });
    return jsonResponse(req, { error: "Failed to fetch event" }, { status: 500 });
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
    return jsonResponse(req, { error: "Invalid event ID" }, { status: 400 });
  }

  try {
    const deleted = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        "DELETE FROM events WHERE id = $1 RETURNING id, name",
        [parsedId.data]
      );
      const row = res.rows[0];
      if (!row) return null;

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "event.deleted",
        resourceType: "event",
        resourceId: row.id,
        metadata: { name: row.name },
      });

      return row;
    });

    if (!deleted) {
      return jsonResponse(req, { error: "Event not found" }, { status: 404 });
    }

    return jsonResponse(req, { deleted: true, id: deleted.id });
  } catch (err) {
    logger.error("Failed to delete event", { error: err });
    return jsonResponse(req, { error: "Failed to delete event" }, { status: 500 });
  }
}
