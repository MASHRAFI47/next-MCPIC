import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Client } = pg;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERROR: Set DATABASE_URL in .env.local");
    process.exit(1);
  }

  const email = (process.env.SEED_ADMIN_EMAIL || "admin@mcpscictclub.com")
    .trim()
    .toLowerCase();
  const name = (process.env.SEED_ADMIN_NAME || "MCPIC Admin").trim();

  let password = process.env.SEED_ADMIN_PASSWORD || "";
  let generated = false;
  if (!password) {
    password = `Mc!${crypto.randomBytes(12).toString("base64url")}9`;
    generated = true;
  }
  if (password.length < 12) {
    console.error("ERROR: SEED_ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.user_role', 'system', true)");

    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      await client.query(
        `UPDATE users
         SET role = 'admin', designation = 'Advisor', email_verified_at = COALESCE(email_verified_at, NOW())
         WHERE email = $1`,
        [email]
      );
      console.log(`Admin account already exists; verified admin role for ${email}.`);
    } else {
      await client.query(
        `INSERT INTO users (email, name, password_hash, role, designation, email_verified_at)
         VALUES ($1, $2, $3, 'admin', 'Advisor', NOW())`,
        [email, name, passwordHash]
      );
      console.log(`Created initial admin account: ${email}`);
      if (generated) {
        console.log("One-time generated password (store securely and enable MFA immediately):");
        console.log(password);
      }
    }

    await client.query(
      `INSERT INTO site_settings (key, value)
       VALUES ('recruitment', '{"enabled": false}'::JSONB)
       ON CONFLICT (key) DO NOTHING`
    );

    await client.query("COMMIT");
    console.log("Seed completed successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
