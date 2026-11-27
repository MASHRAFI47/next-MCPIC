import { Pool, type PoolClient } from "pg";
import { getEnv } from "./env";
import { logger } from "./logger";

export type DbRole = "anonymous" | "member" | "admin" | "system";

export interface DbContext {
  userId?: string | null;
  role: DbRole;
}

declare global {
  // eslint-disable-next-line no-var
  var __mcpicPgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global.__mcpicPgPool) {
    const { databaseUrl, isProd } = getEnv();
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not configured.");
    }
    global.__mcpicPgPool = new Pool({
      connectionString: databaseUrl,
      min: 2,
      max: 15,
      idleTimeoutMillis: 60_000,
      connectionTimeoutMillis: 10_000,
      statement_timeout: 10_000,
      ssl: isProd && !databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1")
        ? { rejectUnauthorized: true }
        : undefined,
    });
    global.__mcpicPgPool.on("error", (err) => {
      logger.error("Unexpected PostgreSQL pool error", { error: err });
    });
  }
  return global.__mcpicPgPool;
}

/**
 * Single round-trip read helper for strictly public, read-only tables whose
 * PostgreSQL RLS SELECT policy is `USING (true)` (events, segments, blogs,
 * achievements, executive_members, site_settings). Avoids BEGIN/set_config/COMMIT
 * overhead (1 DB round-trip instead of 4) while still executing as the
 * least-privilege `mcpic_app` role with forced RLS active.
 */
export async function queryPublic<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  values?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  const res = await pool.query<T>(text, values);
  return res.rows;
}

/**
 * Executes a callback inside a PostgreSQL transaction with transaction-local
 * session settings (`app.user_id`, `app.user_role`) so Row Level Security (RLS)
 * policies are strictly enforced on every query.
 */
export async function withDbContext<T>(
  ctx: DbContext,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT set_config('app.user_id', $1, true), set_config('app.user_role', $2, true)",
      [ctx.userId ?? "", ctx.role]
    );
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function writeAuditLog(
  client: PoolClient,
  params: {
    actorId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await client.query(
    `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [
      params.actorId ?? null,
      params.action,
      params.resourceType,
      params.resourceId ?? null,
      JSON.stringify(params.metadata ?? {}),
    ]
  );
}
