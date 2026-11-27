import type { PoolClient } from "pg";
import { withDbContext } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { NotificationAudience, NotificationCategory } from "@/types/models";

export interface CreateNotificationParams {
  audience: NotificationAudience;
  targetUserId?: string | null;
  category: NotificationCategory;
  title: string;
  body: string;
  link?: string;
  createdBy?: string | null;
}

function sanitizeInternalLink(link?: string): string {
  const trimmed = (link ?? "/").trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed.slice(0, 300);
  }
  return "/";
}

/**
 * Writes a notification row using an existing admin/system DB client or a fresh system transaction.
 * Swallows non-critical DB errors (logging a warning) so primary mutations never fail if
 * notifications tables have not been migrated yet.
 */
export async function createNotification(
  params: CreateNotificationParams,
  existingClient?: PoolClient
): Promise<void> {
  const safeTitle = params.title.trim().slice(0, 140);
  const safeBody = params.body.trim().slice(0, 320);
  const safeLink = sanitizeInternalLink(params.link);

  const insert = async (client: PoolClient) => {
    await client.query(
      `INSERT INTO notifications (audience, target_user_id, category, title, body, link, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        params.audience,
        params.audience === "user" ? params.targetUserId ?? null : null,
        params.category,
        safeTitle,
        safeBody,
        safeLink,
        params.createdBy ?? null,
      ]
    );
  };

  try {
    if (existingClient) {
      // Use a savepoint so a notification failure never aborts the caller's outer transaction
      await existingClient.query("SAVEPOINT sp_create_notification");
      try {
        await insert(existingClient);
        await existingClient.query("RELEASE SAVEPOINT sp_create_notification");
      } catch (innerErr) {
        await existingClient.query("ROLLBACK TO SAVEPOINT sp_create_notification").catch(() => {});
        throw innerErr;
      }
    } else {
      await withDbContext({ role: "system" }, insert);
    }
  } catch (err) {
    logger.warn("Failed to create notification", {
      category: params.category,
      audience: params.audience,
      error: err,
    });
  }
}
