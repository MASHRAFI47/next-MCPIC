import { queryPublic, withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { achievementSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "none", csrf: false });
  if (!guard.ok) return guard.response;

  try {
    const items = await queryPublic(
      `SELECT id, title, tag, image_url, year, display_order, created_at
       FROM achievements
       ORDER BY display_order ASC, created_at DESC`
    );

    const res = jsonResponse(req, items);
    res.headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
    return res;
  } catch (err) {
    logger.error("Failed to fetch achievements", { error: err });
    return jsonResponse(req, { error: "Failed to load achievements" }, { status: 500 });
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

  const parsed = achievementSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid achievement payload" },
      { status: 400 }
    );
  }

  const d = parsed.data;

  try {
    const created = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `INSERT INTO achievements (title, tag, image_url, year, display_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, title, tag, image_url, year, display_order, created_at`,
        [d.title, d.tag, d.imageUrl, d.year || null, d.displayOrder]
      );

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "achievement.created",
        resourceType: "achievement",
        resourceId: res.rows[0].id,
        metadata: { title: d.title },
      });

      return res.rows[0];
    });

    return jsonResponse(req, created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create achievement", { error: err });
    return jsonResponse(req, { error: "Failed to create achievement" }, { status: 500 });
  }
}
