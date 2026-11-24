import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { adminUpdateUserSchema, uuidSchema } from "@/lib/validators";

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
    return jsonResponse(req, { error: "Invalid user ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = adminUpdateUserSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid update payload" },
      { status: 400 }
    );
  }

  const { role, designation } = parsed.data;
  const actorId = guard.session!.user.id;

  // Prevent an admin from locking themselves out by demoting their own account
  if (parsedId.data === actorId && role && role !== "admin") {
    return jsonResponse(
      req,
      { error: "You cannot demote your own admin account." },
      { status: 400 }
    );
  }

  try {
    const updated = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `UPDATE users
         SET role = COALESCE($1::user_role, role),
             designation = COALESCE($2, designation)
         WHERE id = $3
         RETURNING id, email, name, image_url, role, designation`,
        [role ?? null, designation ?? null, parsedId.data]
      );
      const row = res.rows[0];
      if (!row) return null;

      await writeAuditLog(client, {
        actorId,
        action: "user.admin_updated",
        resourceType: "user",
        resourceId: row.id,
        metadata: { role, designation },
      });

      return row;
    });

    if (!updated) {
      return jsonResponse(req, { error: "User not found" }, { status: 404 });
    }

    return jsonResponse(req, updated);
  } catch (err) {
    logger.error("Failed to update user", { error: err });
    return jsonResponse(req, { error: "Failed to update user" }, { status: 500 });
  }
}
