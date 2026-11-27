import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { executiveMemberSchema, uuidSchema } from "@/lib/validators";

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
    return jsonResponse(req, { error: "Invalid executive member ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = executiveMemberSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid executive member data" },
      { status: 400 }
    );
  }

  const d = parsed.data;

  try {
    const updated = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `UPDATE executive_members
         SET panel_year = $1, name = $2, post = $3, image_url = $4, display_order = $5
         WHERE id = $6
         RETURNING id, panel_year, name, post, image_url, display_order`,
        [d.panelYear, d.name, d.post, d.imageUrl, d.displayOrder, parsedId.data]
      );
      const row = res.rows[0];
      if (!row) return null;

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "executive_member.updated",
        resourceType: "executive_member",
        resourceId: row.id,
      });

      return row;
    });

    if (!updated) {
      return jsonResponse(req, { error: "Executive member not found" }, { status: 404 });
    }

    return jsonResponse(req, updated);
  } catch (err) {
    logger.error("Failed to update executive member", { error: err });
    return jsonResponse(req, { error: "Failed to update executive member" }, { status: 500 });
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
    return jsonResponse(req, { error: "Invalid executive member ID" }, { status: 400 });
  }

  try {
    const deleted = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        "DELETE FROM executive_members WHERE id = $1 RETURNING id, name",
        [parsedId.data]
      );
      const row = res.rows[0];
      if (!row) return null;

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "executive_member.deleted",
        resourceType: "executive_member",
        resourceId: row.id,
        metadata: { name: row.name },
      });

      return row;
    });

    if (!deleted) {
      return jsonResponse(req, { error: "Executive member not found" }, { status: 404 });
    }

    return jsonResponse(req, { deleted: true });
  } catch (err) {
    logger.error("Failed to delete executive member", { error: err });
    return jsonResponse(req, { error: "Failed to delete executive member" }, { status: 500 });
  }
}
