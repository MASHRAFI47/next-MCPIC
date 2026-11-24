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
      if (eventIdParam) {
        const res = await client.query(
          `SELECT s.id, s.event_id, e.name AS event_name, e.slug AS event_slug,
                  s.name, s.description, s.image_url, s.start_date, s.end_date, s.created_at
           FROM segments s
           JOIN events e ON e.id = s.event_id
           WHERE s.event_id = $1
           ORDER BY s.created_at DESC`,
          [eventIdParam]
        );
        return res.rows;
      }

      const res = await client.query(
        `SELECT s.id, s.event_id, e.name AS event_name, e.slug AS event_slug,
                s.name, s.description, s.image_url, s.start_date, s.end_date, s.created_at
         FROM segments s
         JOIN events e ON e.id = s.event_id
         ORDER BY s.created_at DESC`
      );
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

  const { eventId, name, description, imageUrl, startDate, endDate } = parsed.data;

  try {
    const created = await withDbContext(guard.dbCtx, async (client) => {
      const eventCheck = await client.query("SELECT id FROM events WHERE id = $1 LIMIT 1", [eventId]);
      if (!eventCheck.rowCount) return null;

      const res = await client.query(
        `INSERT INTO segments (event_id, name, description, image_url, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, event_id, name, description, image_url, start_date, end_date, created_at`,
        [eventId, name, description, imageUrl, startDate, endDate]
      );

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "segment.created",
        resourceType: "segment",
        resourceId: res.rows[0].id,
        metadata: { eventId, name },
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
