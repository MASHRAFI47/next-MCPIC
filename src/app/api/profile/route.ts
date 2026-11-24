import { withDbContext } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { updateProfileSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "authenticated", csrf: false });
  if (!guard.ok) return guard.response;

  try {
    const profile = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query<{
        id: string;
        email: string;
        name: string;
        image_url: string;
        role: string;
        designation: string;
        email_verified_at: Date | null;
        mfa_enabled: boolean;
        created_at: Date;
      }>(
        `SELECT id, email, name, image_url, role, designation, email_verified_at, mfa_enabled, created_at
         FROM users WHERE id = $1 LIMIT 1`,
        [guard.session!.user.id]
      );
      return res.rows[0] ?? null;
    });

    if (!profile) {
      return jsonResponse(req, { error: "Profile not found" }, { status: 404 });
    }

    return jsonResponse(req, {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      imageUrl: profile.image_url,
      role: profile.role,
      designation: profile.designation,
      emailVerified: Boolean(profile.email_verified_at),
      mfaEnabled: profile.mfa_enabled,
      createdAt: profile.created_at,
    });
  } catch (err) {
    logger.error("Failed to fetch profile", { error: err });
    return jsonResponse(req, { error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const guard = await guardRequest(req, {
    auth: "authenticated",
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

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { name, imageUrl } = parsed.data;
  if (!name && !imageUrl) {
    return jsonResponse(req, { error: "Nothing to update" }, { status: 400 });
  }

  try {
    const updated = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             image_url = COALESCE($2, image_url)
         WHERE id = $3
         RETURNING id, email, name, image_url, role, designation`,
        [name ?? null, imageUrl ?? null, guard.session!.user.id]
      );
      return res.rows[0] ?? null;
    });

    return jsonResponse(req, { profile: updated });
  } catch (err) {
    logger.error("Failed to update profile", { error: err });
    return jsonResponse(req, { error: "Failed to update profile" }, { status: 500 });
  }
}
