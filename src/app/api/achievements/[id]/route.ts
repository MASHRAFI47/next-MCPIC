import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { achievementSchema, uuidSchema } from "@/lib/validators";

export async function PATCH(
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
    return jsonResponse(req, { error: "Invalid achievement ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = achievementSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid achievement payload" },
      { status: 400 }
    );
  }

  const d = parsed.data;

  try {
    const updated = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `UPDATE achievements
         SET title = $1, tag = $2, image_url = $3, year = $4, display_order = $5
         WHERE id = $6
         RETURNING id, title, tag, image_url, year, display_order`,
        [d.title, d.tag, d.imageUrl, d.year || null, d.displayOrder, parsedId.data]
      );
      const row = res.rows[0];
      if (!row) return null;

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "achievement.updated",
        resourceType: "achievement",
        resourceId: row.id,
      });

      return row;
    });

    if (!updated) {
      return jsonResponse(req, { error: "Achievement not found" }, { status: 404 });
    }

    return jsonResponse(req, updated);
  } catch (err) {
    logger.error("Failed to update achievement", { error: err });
    return jsonResponse(req, { error: "Failed to update achievement" }, { status: 500 });
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
    return jsonResponse(req, { error: "Invalid achievement ID" }, { status: 400 });
  }

  try {
    const deleted = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        "DELETE FROM achievements WHERE id = $1 RETURNING id, title",
        [parsedId.data]
      );
      const row = res.rows[0];
      if (!row) return null;

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "achievement.deleted",
        resourceType: "achievement",
        resourceId: row.id,
        metadata: { title: row.title },
      });

      return row;
    });

    if (!deleted) {
      return jsonResponse(req, { error: "Achievement not found" }, { status: 404 });
    }

    return jsonResponse(req, { deleted: true });
  } catch (err) {
    logger.error("Failed to delete achievement", { error: err });
    return jsonResponse(req, { error: "Failed to delete achievement" }, { status: 500 });
  }
}
