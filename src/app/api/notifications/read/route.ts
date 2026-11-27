import { z } from "zod";
import { withDbContext } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { uuidSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

const markReadSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ id: uuidSchema }),
]);

/**
 * POST /api/notifications/read — Marks one notification or all visible notifications read
 * for the authenticated user (enforced via PostgreSQL RLS).
 */
export async function POST(req: Request) {
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

  const parsed = markReadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(req, { error: "Provide { id } or { all: true }" }, { status: 400 });
  }

  const userId = guard.session!.user.id;

  try {
    await withDbContext(guard.dbCtx, async (client) => {
      if ("all" in parsed.data) {
        await client.query(
          `INSERT INTO notification_reads (notification_id, user_id)
           SELECT n.id, $1
           FROM notifications n
           LEFT JOIN notification_reads nr
             ON nr.notification_id = n.id AND nr.user_id = $1
           WHERE nr.notification_id IS NULL
           ON CONFLICT (notification_id, user_id) DO NOTHING`,
          [userId]
        );
      } else {
        await client.query(
          `INSERT INTO notification_reads (notification_id, user_id)
           SELECT n.id, $2
           FROM notifications n
           WHERE n.id = $1
           ON CONFLICT (notification_id, user_id) DO NOTHING`,
          [parsed.data.id, userId]
        );
      }
    });

    return jsonResponse(req, { ok: true });
  } catch (err) {
    logger.error("Failed to mark notification read", { error: err });
    return jsonResponse(req, { error: "Failed to update notification state" }, { status: 500 });
  }
}
