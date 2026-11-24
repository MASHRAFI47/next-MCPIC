import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

async function main() {
  const adminUrl = process.env.DATABASE_ADMIN_URL || process.env.DATABASE_URL;
  if (!adminUrl) {
    console.error("ERROR: Set DATABASE_ADMIN_URL (or DATABASE_URL) in .env.local");
    process.exit(1);
  }

  const appPassword = process.env.DB_APP_PASSWORD;
  const schemaPath = path.join(process.cwd(), "db", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  const client = new Client({ connectionString: adminUrl });
  await client.connect();

  try {
    console.log("Applying PostgreSQL schema and Row Level Security policies...");
    await client.query(schemaSql);

    if (appPassword && appPassword.length >= 12) {
      // Create or update least-privilege non-superuser role so RLS is strictly enforced
      const roleCheck = await client.query(
        "SELECT 1 FROM pg_roles WHERE rolname = 'mcpic_app'"
      );
      if (roleCheck.rowCount === 0) {
        // Password must be safely escaped as a SQL literal
        const escaped = client.escapeLiteral(appPassword);
        await client.query(
          `CREATE ROLE mcpic_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS PASSWORD ${escaped}`
        );
        console.log("Created least-privilege role: mcpic_app (NOBYPASSRLS)");
      } else {
        const escaped = client.escapeLiteral(appPassword);
        await client.query(`ALTER ROLE mcpic_app WITH PASSWORD ${escaped} NOBYPASSRLS`);
        console.log("Updated role: mcpic_app (NOBYPASSRLS)");
      }

      await client.query(`
        GRANT USAGE ON SCHEMA public TO mcpic_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mcpic_app;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mcpic_app;
        GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO mcpic_app;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mcpic_app;
      `);
      console.log("Granted minimal table/function privileges to mcpic_app.");
    } else {
      console.warn(
        "WARNING: DB_APP_PASSWORD not set (min 12 chars). Skipped mcpic_app role creation."
      );
    }

    console.log("Database setup complete.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Database setup failed:", err.message);
  process.exit(1);
});
