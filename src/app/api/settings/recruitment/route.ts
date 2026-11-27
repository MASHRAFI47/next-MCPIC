import { queryPublic, withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { recruitmentToggleSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "none", csrf: false });
  if (!guard.ok) return guard.response;

  try {
    const rows = await queryPublic<{ value: { enabled?: boolean } }>(
      "SELECT value FROM site_settings WHERE key = 'recruitment' LIMIT 1"
    );
    const enabled = Boolean(rows[0]?.value?.enabled);

    const res = jsonResponse(req, { enabled });
    res.headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
    return res;
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

      if (enabled) {
        await createNotification(
          {
            audience: "members",
            category: "recruitment",
            title: "Executive Recruitment Is Now Open!",
            body: "Applications for the MCPIC Executive Committee are open. Submit your application today.",
            link: "/apply-for-executive",
            createdBy: guard.session!.user.id,
          },
          client
        );
      }
    });

    return jsonResponse(req, { enabled });
  } catch (err) {
    logger.error("Failed to update recruitment setting", { error: err });
    return jsonResponse(req, { error: "Failed to update setting" }, { status: 500 });
  }
}
