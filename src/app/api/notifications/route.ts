import { z } from "zod";
import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import type { NotificationRecord } from "@/types/models";

export const dynamic = "force-dynamic";

const createAnnouncementSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  body: z.string().trim().min(5, "Message must be at least 5 characters").max(300),
  link: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => {
      if (!v) return "/";
      return v.startsWith("/") && !v.startsWith("//") ? v : "/";
    }),
  audience: z.enum(["members", "all", "admins"]).default("members"),
});

/**
 * GET /api/notifications — Authenticated users only.
 * PostgreSQL RLS strictly scopes rows to the caller's role & user_id.
 */
export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "authenticated", csrf: false });
  if (!guard.ok) return guard.response;

  const userId = guard.session!.user.id;

  try {
    // Single combined CTE query returns the latest 25 notifications + total unread count in 1 round-trip
    const data = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query<NotificationRecord & { unread_total: number }>(
        `WITH visible AS (
           SELECT
             n.id,
             n.audience,
             n.category,
             n.title,
             n.body,
             n.link,
             (nr.notification_id IS NOT NULL) AS is_read,
             n.created_at
           FROM notifications n
           LEFT JOIN notification_reads nr
             ON nr.notification_id = n.id AND nr.user_id = $1
         ),
         unread_cnt AS (
           SELECT COUNT(*)::int AS total FROM visible WHERE NOT is_read
         )
         SELECT v.*, u.total AS unread_total
         FROM visible v
         CROSS JOIN unread_cnt u
         ORDER BY v.created_at DESC
         LIMIT 25`,
        [userId]
      );

      const unreadCount = res.rows[0]?.unread_total ?? 0;
      const notifications: NotificationRecord[] = res.rows.map(
        ({ unread_total: _unused, ...item }) => item
      );

      return { notifications, unreadCount };
    });

    const res = jsonResponse(req, data);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    logger.error("Failed to load notifications", { error: err });
    return jsonResponse(req, { notifications: [], unreadCount: 0 });
  }
}

/**
 * POST /api/notifications — Admin only. Broadcasts a custom announcement notification.
 */
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

  const parsed = createAnnouncementSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid announcement payload" },
      { status: 400 }
    );
  }

  const { title, body: message, link, audience } = parsed.data;
  const actorId = guard.session!.user.id;

  try {
    // Admin authorization is already enforced by guardRequest({ auth: "admin" }).
    // Use system DB context so INSERT ... RETURNING succeeds even when targeting 'members'
    // (while GET still uses guard.dbCtx so admins only see admin-scoped notifications).
    const created = await withDbContext(
      { userId: actorId, role: "system" },
      async (client) => {
        const res = await client.query(
          `INSERT INTO notifications (audience, category, title, body, link, created_by)
           VALUES ($1, 'announcement', $2, $3, $4, $5)
           RETURNING id, audience, category, title, body, link, created_at`,
          [audience, title, message, link, actorId]
        );

        await writeAuditLog(client, {
          actorId,
          action: "notification.broadcast",
          resourceType: "notification",
          resourceId: res.rows[0].id,
          metadata: { audience, title },
        });

        return res.rows[0];
      }
    );

    return jsonResponse(req, created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create announcement notification", { error: err });
    return jsonResponse(req, { error: "Failed to send announcement" }, { status: 500 });
  }
}
