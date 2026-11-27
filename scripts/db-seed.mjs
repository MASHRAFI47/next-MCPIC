import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Client } = pg;

const DEFAULT_ACHIEVEMENTS = [
  { title: "Inter-College IT Olympiad Triumph", tag: "National Recognition", image_url: "/images/achievements/achievement1.jpg", year: "2024", display_order: 1 },
  { title: "Tech Fest Championship Showcase", tag: "Team Excellence", image_url: "/images/achievements/achievement2.jpg", year: "2024", display_order: 2 },
  { title: "Programming & Problem Solving", tag: "Coding Arena", image_url: "/images/achievements/achievement3.jpg", year: "2024", display_order: 3 },
  { title: "Creative Design & Multimedia Award", tag: "Digital Arts", image_url: "/images/achievements/achievement4.jpg", year: "2023", display_order: 4 },
  { title: "Institutional Innovation Honors", tag: "Innovation", image_url: "/images/achievements/achievement5.jpg", year: "2023", display_order: 5 },
  { title: "MCPIC Flagship Competition Moments", tag: "Community Pride", image_url: "/images/achievements/achievement6.jpg", year: "2024", display_order: 6 },
  { title: "Rising Tech Leaders Recognition", tag: "Hall of Fame", image_url: "/images/achievements/achievement7.jpeg", year: "2025", display_order: 7 },
];

const BLANK = "/images/blank.webp";

const DEFAULT_EXECUTIVES = [
  // 2025-2026
  { year: "2025-2026", name: "Aryan Kamal Aviv", post: "President", image: "/images/panel25to26/aryan-kamal-aviv.jpg" },
  { year: "2025-2026", name: "Raiyan Hasan", post: "Vice President", image: "/images/panel25to26/Raiyan-Hasan.jpg" },
  { year: "2025-2026", name: "Proloy Charushi", post: "Vice President", image: "/images/panel25to26/Proloy-Charushi.jpeg" },
  { year: "2025-2026", name: "Maisha Majed", post: "Secretary", image: "/images/panel25to26/Maisha-Majed.jpeg" },
  { year: "2025-2026", name: "Tasnim Zerin Ohana", post: "Assistant Secretary", image: "/images/panel25to26/Tasnim-Zerin-Ohana.jpeg" },
  { year: "2025-2026", name: "Zaima Khanam Warda", post: "Joint Secretary", image: "/images/panel25to26/Zaima-Khanam-Warda.jpg" },
  { year: "2025-2026", name: "Abdul Kadir Kabbo", post: "IT Head", image: "/images/panel25to26/abdul-kadir-kabbo.jpeg" },
  { year: "2025-2026", name: "Soyad Soroar", post: "Head of Content", image: "/images/panel25to26/Soyad-Soroar.webp" },
  { year: "2025-2026", name: "Tasfiah Tasnim", post: "Treasurer", image: "/images/panel25to26/Tasfiah-Tasnim.webp" },
  { year: "2025-2026", name: "Afrida Ahnaf Chowdhury Bevor", post: "Organizing Secretary", image: "/images/panel25to26/Afrida-Ahnaf-Chowdhury-Bevor.jpg" },
  { year: "2025-2026", name: "Zarin Tasnim Nowshin", post: "Asst. Organizing Secretary", image: "/images/panel25to26/Zarin-Tasnim-Nowshin.webp" },
  { year: "2025-2026", name: "Arosh Bin Wahid", post: "Logistician", image: "/images/panel25to26/Arosh-Bin-Wahid.png" },
  { year: "2025-2026", name: "Tazwar Tausif", post: "Content Manager", image: "/images/panel25to26/Tazwar-Tausif.jpeg" },
  { year: "2025-2026", name: "Fuad Bin Qaium", post: "IT Officer", image: "/images/panel25to26/Fuad-Bin-Qaium.jpeg" },
  { year: "2025-2026", name: "Azora Islam Ohie", post: "Public Relations Officer", image: "/images/panel25to26/Azora-Islam-Ohie.jpeg" },
  { year: "2025-2026", name: "Sadia Mubash Shara", post: "Human Resources Manager", image: "/images/panel25to26/Sadia-Mubash-Sara.jpeg" },
  { year: "2025-2026", name: "Nazifa Sumaiya", post: "Executive", image: "/images/panel25to26/Nazifa-Sumaiya.jpeg" },
  // 2024-2025
  { year: "2024-2025", name: "Mahfuz Ahmed Likhon", post: "President", image: "/images/panel23to24/mahfuz.jpg" },
  { year: "2024-2025", name: "Tasniha Tanzil Zerin", post: "Vice President", image: BLANK },
  { year: "2024-2025", name: "Raiyan Hasan", post: "Vice President", image: "/images/panel/raiyan.jpg" },
  { year: "2024-2025", name: "Aryan Kamal Aviv", post: "Secretary", image: "/images/panel/aviv.png" },
  { year: "2024-2025", name: "Maisha Majed", post: "Assistant Secretary", image: "/images/panel23to24/maisha.jpg" },
  { year: "2024-2025", name: "Humayra Jahan Hridita", post: "Joint Secretary", image: BLANK },
  { year: "2024-2025", name: "Proloy Charushi", post: "IT Head", image: "/images/panel/proloy.jpg" },
  { year: "2024-2025", name: "Zarin Tasnim Nowshin", post: "Treasurer", image: "/images/panel22to23/nowshin.jpg" },
  { year: "2024-2025", name: "Afrida Ahnaf Chowdhury Bivor", post: "Organizing Secretary", image: BLANK },
  { year: "2024-2025", name: "Tasfiah Tasnim", post: "Assistant Organizing Secretary", image: "/images/panel23to24/tashfia.jpeg" },
  { year: "2024-2025", name: "Ahnaf Muttaki Adib", post: "Field Manager", image: "/images/panel/adib.jpg" },
  { year: "2024-2025", name: "Safayet Hossain Sabyoun", post: "Content Manager", image: BLANK },
  { year: "2024-2025", name: "Jerin Subah Aroni", post: "Content Manager", image: BLANK },
  { year: "2024-2025", name: "Azora Islam Ohie", post: "Public Relations Officer", image: "/images/panel23to24/azora.jpg" },
  { year: "2024-2025", name: "Sumormee Sumanto", post: "Information Technology Officer", image: BLANK },
  { year: "2024-2025", name: "Soyad Soroar", post: "Designer", image: BLANK },
  { year: "2024-2025", name: "Tasnim Zerin Ohana", post: "Executive", image: BLANK },
  { year: "2024-2025", name: "Abdul Kadir Kabbo", post: "IT Officer", image: BLANK },
  // 2023-2024
  { year: "2023-2024", name: "Afiun Nahar", post: "Moderator", image: BLANK },
  { year: "2023-2024", name: "Mashrafi Bin Nur", post: "Advisor", image: "/images/panel/mashrafi.jpg" },
  { year: "2023-2024", name: "MD. Arikuzzaman", post: "Advisor", image: "/images/panel/Arik.jpg" },
  { year: "2023-2024", name: "Samiul Haque Chowdhury", post: "Advisor", image: "/images/panel/samiulsami.jpg" },
  { year: "2023-2024", name: "Areeb Jawad", post: "President", image: "/images/panel/Areeb.jpg" },
  { year: "2023-2024", name: "MD. Fahad Hossain", post: "Vice President", image: "/images/panel/fahad.jpg" },
  { year: "2023-2024", name: "Abdullah Islam Sabiq", post: "General Secretary", image: "/images/panel/sabiq.jpeg" },
  { year: "2023-2024", name: "Raiyan Hasan", post: "Head of IT", image: "/images/panel/raiyan.jpg" },
  { year: "2023-2024", name: "MD. Salehin Alam", post: "Organizing Secretary", image: BLANK },
  { year: "2023-2024", name: "Proloy Charushi", post: "Asst. General Secretary", image: "/images/panel/proloy.jpg" },
  { year: "2023-2024", name: "Yasar Faqid Zaman", post: "Asst. Organizing Secretary", image: "/images/panel23to24/faqid.jpeg" },
  { year: "2023-2024", name: "Tasnia Naushin Ela", post: "Organizing Secretary", image: "/images/panel23to24/tasniha.jpg" },
  { year: "2023-2024", name: "Tashfia Tasnim", post: "Public Relations Officer", image: "/images/panel23to24/tashfia.jpeg" },
  { year: "2023-2024", name: "Ajwad Abrar", post: "Joint Secretary", image: "/images/panel/ajwadAbrar.jpeg" },
  { year: "2023-2024", name: "Soyad Sorower", post: "Media Councilor", image: BLANK },
  { year: "2023-2024", name: "Mustakim Nur Salin", post: "IT Secretary", image: BLANK },
  { year: "2023-2024", name: "Tasniha Tanzil Zerin", post: "IT Officer", image: "/images/panel23to24/tanzil-zerin.jpg" },
  { year: "2023-2024", name: "Azora Islam", post: "HR Manager", image: "/images/panel23to24/azora.jpg" },
  { year: "2023-2024", name: "Muhammad Irteza", post: "Designer", image: "/images/panel23to24/adnan.jpg" },
  { year: "2023-2024", name: "Maisha Majed", post: "Content Manager", image: "/images/panel23to24/maisha.jpg" },
  { year: "2023-2024", name: "Sazzatul Meraz Ayaan", post: "Executive", image: "/images/panel23to24/ayaan.jpeg" },
  { year: "2023-2024", name: "Mahfuz Ahmed Likhon", post: "IT Officer", image: "/images/panel23to24/mahfuz.jpg" },
  { year: "2023-2024", name: "Aryan Kamal Aviv", post: "Field Officer", image: "/images/panel/aviv.png" },
  { year: "2023-2024", name: "Ahnaf Muttaki Adib", post: "Field Officer", image: "/images/panel/adib.jpg" },
  // 2022-2023
  { year: "2022-2023", name: "Afiun Nahar", post: "Moderator", image: BLANK },
  { year: "2022-2023", name: "Mashrafi Bin Nur", post: "President", image: "/images/panel/mashrafi.jpg" },
  { year: "2022-2023", name: "MD. Arikuzzaman", post: "Vice President (Admin)", image: "/images/panel/Arik.jpg" },
  { year: "2022-2023", name: "Samiul Haque Chowdhury", post: "Vice President (Event)", image: "/images/panel/samiulsami.jpg" },
  { year: "2022-2023", name: "Raiyan Hasan", post: "Vice President (IT)", image: "/images/panel/raiyan.jpg" },
  { year: "2022-2023", name: "Abdullah Islam Sabiq", post: "General Secretary", image: "/images/panel/sabiq.jpeg" },
  { year: "2022-2023", name: "Zaima Khanam Warda", post: "Organizing Secretary", image: BLANK },
  { year: "2022-2023", name: "Ahnaf Muttaki Adib", post: "Treasurer", image: "/images/panel/adib.jpg" },
  { year: "2022-2023", name: "Fahad Hossain", post: "Field Officer", image: "/images/panel/fahad.jpg" },
  { year: "2022-2023", name: "Aryan Kamal Aviv", post: "Field Officer", image: "/images/panel/aviv.png" },
  { year: "2022-2023", name: "Tanzim Hasan Bhuiyan", post: "Event Manager", image: BLANK },
  { year: "2022-2023", name: "Afrida Ahnaf Chowdhury", post: "Public Relations Officer", image: BLANK },
  { year: "2022-2023", name: "Zarin Tasnim Nowshin", post: "Content Writer", image: "/images/panel22to23/nowshin.jpg" },
  { year: "2022-2023", name: "Areeb Jawad", post: "IT Secretary", image: "/images/panel/Areeb.jpg" },
  { year: "2022-2023", name: "Afsheen Iqbal", post: "Content Writer", image: BLANK },
  { year: "2022-2023", name: "Proloy Charushi", post: "Designer", image: "/images/panel/proloy.jpg" },
  { year: "2022-2023", name: "Ajwad Abrar", post: "Executive Member (IT)", image: "/images/panel/ajwadAbrar.jpeg" },
  { year: "2022-2023", name: "Junaira Mehreen", post: "Executive Member (IT)", image: "/images/panel/mehreen.jpg" },
  { year: "2022-2023", name: "Faria Afrin Raisa", post: "Executive Member (Admin)", image: BLANK },
  { year: "2022-2023", name: "Mahdi Ashyam", post: "Executive Member (Event)", image: BLANK },
  { year: "2022-2023", name: "Israt Jahan Labiba", post: "Executive Member", image: "/images/panel22to23/labiba.jpeg" },
  { year: "2022-2023", name: "Riad Amin", post: "Executive Member (Admin)", image: BLANK },
];

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

    // Seed Achievements if table is empty
    const achCount = await client.query("SELECT COUNT(*)::int AS count FROM achievements");
    if ((achCount.rows[0]?.count ?? 0) === 0) {
      for (const item of DEFAULT_ACHIEVEMENTS) {
        await client.query(
          `INSERT INTO achievements (title, tag, image_url, year, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [item.title, item.tag, item.image_url, item.year, item.display_order]
        );
      }
      console.log(`Seeded ${DEFAULT_ACHIEVEMENTS.length} achievements.`);
    }

    // Seed Executive Committee panels if table is empty
    const execCount = await client.query("SELECT COUNT(*)::int AS count FROM executive_members");
    if ((execCount.rows[0]?.count ?? 0) === 0) {
      const orderByYear = new Map();
      for (const m of DEFAULT_EXECUTIVES) {
        const nextOrder = (orderByYear.get(m.year) ?? 0) + 1;
        orderByYear.set(m.year, nextOrder);
        await client.query(
          `INSERT INTO executive_members (panel_year, name, post, image_url, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [m.year, m.name, m.post, m.image, nextOrder]
        );
      }
      console.log(`Seeded ${DEFAULT_EXECUTIVES.length} executive committee members.`);
    }

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
