import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { contactStatusSchema, uuidSchema } from "@/lib/validators";

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
    return jsonResponse(req, { error: "Invalid message ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = contactStatusSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(req, { error: "Invalid status value" }, { status: 400 });
  }

  try {
    const updated = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `UPDATE contact_messages
         SET status = $1
         WHERE id = $2
         RETURNING id, name, email, message, status, created_at`,
        [parsed.data.status, parsedId.data]
      );
      const row = res.rows[0];
      if (!row) return null;

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "contact_message.status_updated",
        resourceType: "contact_message",
        resourceId: row.id,
        metadata: { status: parsed.data.status },
      });

      return row;
    });

    if (!updated) {
      return jsonResponse(req, { error: "Message not found" }, { status: 404 });
    }

    return jsonResponse(req, updated);
  } catch (err) {
    logger.error("Failed to update contact message", { error: err });
    return jsonResponse(req, { error: "Failed to update message" }, { status: 500 });
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
    return jsonResponse(req, { error: "Invalid message ID" }, { status: 400 });
  }

  try {
    const deleted = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        "DELETE FROM contact_messages WHERE id = $1 RETURNING id",
        [parsedId.data]
      );
      const row = res.rows[0];
      if (!row) return null;

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "contact_message.deleted",
        resourceType: "contact_message",
        resourceId: row.id,
      });

      return row;
    });

    if (!deleted) {
      return jsonResponse(req, { error: "Message not found" }, { status: 404 });
    }

    return jsonResponse(req, { deleted: true });
  } catch (err) {
    logger.error("Failed to delete contact message", { error: err });
    return jsonResponse(req, { error: "Failed to delete message" }, { status: 500 });
  }
}
