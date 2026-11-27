import { queryPublic, withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { slugify } from "@/lib/security/sanitize";
import { createEventSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "none", csrf: false });
  if (!guard.ok) return guard.response;

  try {
    const events = await queryPublic(
      `SELECT id, slug, name, description, image_url, start_date, end_date,
              created_by, created_by_name, created_at, updated_at
       FROM events
       ORDER BY created_at DESC`
    );

    const res = jsonResponse(req, events);
    res.headers.set("Cache-Control", "public, max-age=15, stale-while-revalidate=60");
    return res;
  } catch (err) {
    logger.error("Failed to fetch events", { error: err });
    return jsonResponse(req, { error: "Failed to fetch events" }, { status: 500 });
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

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid event payload" },
      { status: 400 }
    );
  }

  const { name, description, imageUrl, startDate, endDate } = parsed.data;
  const baseSlug = slugify(name);
  const user = guard.session!.user;

  try {
    const created = await withDbContext(guard.dbCtx, async (client) => {
      let slug = baseSlug;
      const slugCheck = await client.query("SELECT 1 FROM events WHERE slug = $1", [slug]);
      if (slugCheck.rowCount && slugCheck.rowCount > 0) {
        slug = `${baseSlug}-${Date.now().toString(36)}`;
      }

      const res = await client.query(
        `INSERT INTO events (slug, name, description, image_url, start_date, end_date, created_by, created_by_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, slug, name, description, image_url, start_date, end_date, created_by_name, created_at`,
        [slug, name, description, imageUrl, startDate, endDate, user.id, user.name]
      );

      await writeAuditLog(client, {
        actorId: user.id,
        action: "event.created",
        resourceType: "event",
        resourceId: res.rows[0].id,
        metadata: { name },
      });

      await createNotification(
        {
          audience: "members",
          category: "event",
          title: `New Event: ${name}`,
          body:
            description.length > 140 ? `${description.slice(0, 137)}...` : description,
          link: `/events/${encodeURIComponent(slug)}`,
          createdBy: user.id,
        },
        client
      );

      return res.rows[0];
    });

    return jsonResponse(req, created, { status: 201 });
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr?.code === "23505") {
      return jsonResponse(req, { error: "An event with this name already exists." }, { status: 409 });
    }
    logger.error("Failed to create event", { error: err });
    return jsonResponse(req, { error: "Failed to create event" }, { status: 500 });
  }
}
