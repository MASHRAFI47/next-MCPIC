import { withDbContext } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/executive-forms/me
 * Strictly BOLA-safe: derives user ID solely from verified session (never from URL params)
 * and is additionally enforced by PostgreSQL RLS.
 */
export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "authenticated", csrf: false });
  if (!guard.ok) return guard.response;

  try {
    const form = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `SELECT id, user_id, why_executive, hours_per_week, tech_skills, experience,
                leadership_rating, github_profile, awards, status, created_at, updated_at
         FROM executive_applications
         WHERE user_id = $1
         LIMIT 1`,
        [guard.session!.user.id]
      );
      return res.rows[0] ?? null;
    });

    return jsonResponse(req, { form });
  } catch (err) {
    logger.error("Failed to fetch own executive form", { error: err });
    return jsonResponse(req, { error: "Failed to load your form" }, { status: 500 });
  }
}
