import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { executiveApplicationSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/**
 * GET /api/executive-forms — Admin only. Returns all applications with applicant profile info
 * (eliminating the legacy N+1 query per row).
 */
export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "admin", csrf: false });
  if (!guard.ok) return guard.response;

  try {
    const forms = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `SELECT ea.id, ea.user_id, u.name AS full_name, u.email, u.image_url,
                ea.why_executive, ea.hours_per_week, ea.tech_skills, ea.experience,
                ea.leadership_rating, ea.github_profile, ea.awards, ea.status,
                ea.created_at, ea.updated_at
         FROM executive_applications ea
         JOIN users u ON u.id = ea.user_id
         ORDER BY ea.created_at DESC`
      );
      return res.rows;
    });

    return jsonResponse(req, forms);
  } catch (err) {
    logger.error("Failed to fetch executive forms", { error: err });
    return jsonResponse(req, { error: "Failed to fetch executive forms" }, { status: 500 });
  }
}

/**
 * POST /api/executive-forms — Verified authenticated users only.
 * Enforces recruitment-open toggle and one application per user.
 */
export async function POST(req: Request) {
  const guard = await guardRequest(req, {
    auth: "verified",
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

  const parsed = executiveApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid form data" },
      { status: 400 }
    );
  }

  const userId = guard.session!.user.id;
  const d = parsed.data;

  try {
    const result = await withDbContext(guard.dbCtx, async (client) => {
      const settingRes = await client.query<{ value: { enabled?: boolean } }>(
        "SELECT value FROM site_settings WHERE key = 'recruitment' LIMIT 1"
      );
      const isOpen = Boolean(settingRes.rows[0]?.value?.enabled);
      if (!isOpen) {
        return { error: "CLOSED" as const };
      }

      const existing = await client.query(
        "SELECT id FROM executive_applications WHERE user_id = $1 LIMIT 1",
        [userId]
      );
      if (existing.rowCount && existing.rowCount > 0) {
        return { error: "DUPLICATE" as const };
      }

      const inserted = await client.query(
        `INSERT INTO executive_applications
           (user_id, why_executive, hours_per_week, tech_skills, experience, leadership_rating, github_profile, awards)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, user_id, why_executive, hours_per_week, tech_skills, experience,
                   leadership_rating, github_profile, awards, status, created_at`,
        [
          userId,
          d.whyExecutive,
          d.hoursPerWeek,
          d.techSkills,
          d.experience,
          d.leadershipRating,
          d.githubProfile,
          d.awards,
        ]
      );

      await writeAuditLog(client, {
        actorId: userId,
        action: "executive_application.submitted",
        resourceType: "executive_application",
        resourceId: inserted.rows[0].id,
      });

      return { data: inserted.rows[0] };
    });

    if ("error" in result) {
      if (result.error === "CLOSED") {
        return jsonResponse(
          req,
          { error: "Executive recruitment is currently closed." },
          { status: 403 }
        );
      }
      return jsonResponse(
        req,
        { error: "You have already submitted an application. Edit it from Dashboard -> My Forms." },
        { status: 409 }
      );
    }

    await createNotification({
      audience: "admins",
      category: "application",
      title: `New Executive Application: ${guard.session!.user.name}`,
      body: `${guard.session!.user.name} applied for the executive committee. Review in Recruit.`,
      link: "/dashboard/recruit",
      createdBy: userId,
    });

    return jsonResponse(req, result.data, { status: 201 });
  } catch (err) {
    logger.error("Failed to submit executive application", { error: err });
    return jsonResponse(req, { error: "Failed to submit application" }, { status: 500 });
  }
}
