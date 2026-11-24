import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { recruitmentToggleSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "none", csrf: false });
  if (!guard.ok) return guard.response;

  try {
    const enabled = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query<{ value: { enabled?: boolean } }>(
        "SELECT value FROM site_settings WHERE key = 'recruitment' LIMIT 1"
      );
      return Boolean(res.rows[0]?.value?.enabled);
    });

    return jsonResponse(req, { enabled });
  } catch (err) {
    logger.error("Failed to fetch recruitment setting", { error: err });
    return jsonResponse(req, { enabled: false });
  }
}

export async function PUT(req: Request) {
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

  const parsed = recruitmentToggleSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(req, { error: "Invalid boolean 'enabled' value" }, { status: 400 });
  }

  const { enabled } = parsed.data;

  try {
    await withDbContext(guard.dbCtx, async (client) => {
      await client.query(
        `INSERT INTO site_settings (key, value)
         VALUES ('recruitment', $1::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [JSON.stringify({ enabled })]
      );

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "settings.recruitment_toggled",
        resourceType: "site_settings",
        resourceId: "recruitment",
        metadata: { enabled },
      });
    });

    return jsonResponse(req, { enabled });
  } catch (err) {
    logger.error("Failed to update recruitment setting", { error: err });
    return jsonResponse(req, { error: "Failed to update setting" }, { status: 500 });
  }
}
