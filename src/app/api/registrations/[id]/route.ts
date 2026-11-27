import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { uuidSchema } from "@/lib/validators";

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  const guard = await guardRequest(req, {
    auth: "authenticated",
    rateLimit: "write",
    csrf: true,
  });
  if (!guard.ok) return guard.response;

  const parsedId = uuidSchema.safeParse(context.params.id);
  if (!parsedId.success) {
    return jsonResponse(req, { error: "Invalid registration ID" }, { status: 400 });
  }

  const user = guard.session!.user;

  try {
    const outcome = await withDbContext(guard.dbCtx, async (client) => {
      const existing = await client.query<{ id: string; user_id: string | null; ticket_code: string }>(
        "SELECT id, user_id, ticket_code FROM segment_registrations WHERE id = $1 LIMIT 1",
        [parsedId.data]
      );
      const row = existing.rows[0];
      if (!row) return "NOT_FOUND" as const;

      if (user.role !== "admin" && row.user_id !== user.id) {
        return "FORBIDDEN" as const;
      }

      await client.query("DELETE FROM segment_registrations WHERE id = $1", [row.id]);
      await writeAuditLog(client, {
        actorId: user.id,
        action: "registration.cancelled",
        resourceType: "segment_registration",
        resourceId: row.id,
        metadata: { ticketCode: row.ticket_code },
      });

      return "OK" as const;
    });

    if (outcome === "NOT_FOUND") {
      return jsonResponse(req, { error: "Registration not found" }, { status: 404 });
    }
    if (outcome === "FORBIDDEN") {
      return jsonResponse(req, { error: "Forbidden" }, { status: 403 });
    }

    return jsonResponse(req, { deleted: true });
  } catch (err) {
    logger.error("Failed to cancel registration", { error: err });
    return jsonResponse(req, { error: "Failed to cancel registration" }, { status: 500 });
  }
}
