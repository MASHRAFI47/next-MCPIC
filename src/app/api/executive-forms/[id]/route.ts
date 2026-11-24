import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { executiveApplicationSchema, uuidSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const guard = await guardRequest(req, { auth: "authenticated", csrf: false });
  if (!guard.ok) return guard.response;

  const parsedId = uuidSchema.safeParse(context.params.id);
  if (!parsedId.success) {
    return jsonResponse(req, { error: "Invalid application ID" }, { status: 400 });
  }

  try {
    const form = await withDbContext(guard.dbCtx, async (client) => {
      // RLS ensures non-admins can only read rows where user_id = app_user_id()
      const res = await client.query(
        `SELECT id, user_id, why_executive, hours_per_week, tech_skills, experience,
                leadership_rating, github_profile, awards, status, created_at, updated_at
         FROM executive_applications
         WHERE id = $1
         LIMIT 1`,
        [parsedId.data]
      );
      return res.rows[0] ?? null;
    });

    if (!form) {
      return jsonResponse(req, { error: "Application not found" }, { status: 404 });
    }

    // Explicit app-layer BOLA check alongside PostgreSQL RLS
    if (guard.session!.user.role !== "admin" && form.user_id !== guard.session!.user.id) {
      return jsonResponse(req, { error: "Forbidden" }, { status: 403 });
    }

    return jsonResponse(req, form);
  } catch (err) {
    logger.error("Failed to fetch application", { error: err });
    return jsonResponse(req, { error: "Failed to fetch application" }, { status: 500 });
  }
}

export async function PUT(
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
    return jsonResponse(req, { error: "Invalid application ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = executiveApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid form data" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const user = guard.session!.user;

  try {
    const updated = await withDbContext(guard.dbCtx, async (client) => {
      const ownerCheck = await client.query<{ user_id: string }>(
        "SELECT user_id FROM executive_applications WHERE id = $1 LIMIT 1",
        [parsedId.data]
      );
      const existing = ownerCheck.rows[0];
      if (!existing) return "NOT_FOUND" as const;

      if (user.role !== "admin" && existing.user_id !== user.id) {
        return "FORBIDDEN" as const;
      }

      const res = await client.query(
        `UPDATE executive_applications
         SET why_executive = $1,
             hours_per_week = $2,
             tech_skills = $3,
             experience = $4,
             leadership_rating = $5,
             github_profile = $6,
             awards = $7
         WHERE id = $8
         RETURNING id, user_id, why_executive, hours_per_week, tech_skills, experience,
                   leadership_rating, github_profile, awards, status, updated_at`,
        [
          d.whyExecutive,
          d.hoursPerWeek,
          d.techSkills,
          d.experience,
          d.leadershipRating,
          d.githubProfile,
          d.awards,
          parsedId.data,
        ]
      );

      await writeAuditLog(client, {
        actorId: user.id,
        action: "executive_application.updated",
        resourceType: "executive_application",
        resourceId: parsedId.data,
      });

      return res.rows[0];
    });

    if (updated === "NOT_FOUND") {
      return jsonResponse(req, { error: "Application not found" }, { status: 404 });
    }
    if (updated === "FORBIDDEN") {
      return jsonResponse(req, { error: "Forbidden" }, { status: 403 });
    }

    return jsonResponse(req, updated);
  } catch (err) {
    logger.error("Failed to update application", { error: err });
    return jsonResponse(req, { error: "Failed to update application" }, { status: 500 });
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
    return jsonResponse(req, { error: "Invalid application ID" }, { status: 400 });
  }

  try {
    const deleted = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        "DELETE FROM executive_applications WHERE id = $1 RETURNING id, user_id",
        [parsedId.data]
      );
      const row = res.rows[0];
      if (!row) return null;

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "executive_application.deleted",
        resourceType: "executive_application",
        resourceId: row.id,
      });

      return row;
    });

    if (!deleted) {
      return jsonResponse(req, { error: "Application not found" }, { status: 404 });
    }

    return jsonResponse(req, { deleted: true, id: deleted.id });
  } catch (err) {
    logger.error("Failed to delete application", { error: err });
    return jsonResponse(req, { error: "Failed to delete application" }, { status: 500 });
  }
}
