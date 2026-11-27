import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { executiveMemberSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "none", csrf: false });
  if (!guard.ok) return guard.response;

  try {
    const members = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `SELECT id, panel_year, name, post, image_url, display_order, created_at
         FROM executive_members
         ORDER BY panel_year DESC, display_order ASC, created_at ASC`
      );
      return res.rows;
    });

    return jsonResponse(req, members);
  } catch (err) {
    logger.error("Failed to fetch executive members", { error: err });
    return jsonResponse(req, { error: "Failed to load executives" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await guardRequest(req, {
    auth: "admin",
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
    const created = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `INSERT INTO executive_members (panel_year, name, post, image_url, display_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, panel_year, name, post, image_url, display_order, created_at`,
        [d.panelYear, d.name, d.post, d.imageUrl, d.displayOrder]
      );

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "executive_member.created",
        resourceType: "executive_member",
        resourceId: res.rows[0].id,
        metadata: { panelYear: d.panelYear, name: d.name },
      });

      return res.rows[0];
    });

    return jsonResponse(req, created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create executive member", { error: err });
    return jsonResponse(req, { error: "Failed to add executive member" }, { status: 500 });
  }
}
