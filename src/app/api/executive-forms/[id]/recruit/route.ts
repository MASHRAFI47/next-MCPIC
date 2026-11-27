import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { recruitApplicantSchema, uuidSchema } from "@/lib/validators";

/**
 * POST /api/executive-forms/[id]/recruit
 * Atomically assigns the applicant's designation and deletes their pending form
 * inside a single PostgreSQL transaction (admin only).
 */
export async function POST(
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
    return jsonResponse(req, { error: "Invalid application ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = recruitApplicantSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid designation" },
      { status: 400 }
    );
  }

  const { designation } = parsed.data;
  const actorId = guard.session!.user.id;

  try {
    const result = await withDbContext(guard.dbCtx, async (client) => {
      const formRes = await client.query<{ id: string; user_id: string }>(
        "SELECT id, user_id FROM executive_applications WHERE id = $1 LIMIT 1",
        [parsedId.data]
      );
      const form = formRes.rows[0];
      if (!form) return null;

      await client.query(
        "UPDATE users SET designation = $1 WHERE id = $2",
        [designation, form.user_id]
      );

      await client.query("DELETE FROM executive_applications WHERE id = $1", [form.id]);

      await writeAuditLog(client, {
        actorId,
        action: "executive.recruited",
        resourceType: "user",
        resourceId: form.user_id,
        metadata: { designation, applicationId: form.id },
      });

      await createNotification(
        {
          audience: "user",
          targetUserId: form.user_id,
          category: "recruitment",
          title: "Welcome to the Executive Committee!",
          body: `Congratulations! You have been recruited as ${designation}.`,
          link: "/dashboard/profile",
          createdBy: actorId,
        },
        client
      );

      return { userId: form.user_id, designation };
    });

    if (!result) {
      return jsonResponse(req, { error: "Application not found" }, { status: 404 });
    }

    return jsonResponse(req, { message: "Applicant recruited successfully.", ...result });
  } catch (err) {
    logger.error("Failed to recruit applicant", { error: err });
    return jsonResponse(req, { error: "Failed to recruit applicant" }, { status: 500 });
  }
}
