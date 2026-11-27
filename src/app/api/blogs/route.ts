import { queryPublic, withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { slugify } from "@/lib/security/sanitize";
import { createBlogSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await guardRequest(req, { auth: "none", csrf: false });
  if (!guard.ok) return guard.response;

  try {
    const blogs = await queryPublic(
      `SELECT id, slug, title, description, image_url, publisher_id, publisher_name, created_at, updated_at
       FROM blogs
       ORDER BY created_at DESC`
    );

    const res = jsonResponse(req, blogs);
    res.headers.set("Cache-Control", "public, max-age=15, stale-while-revalidate=60");
    return res;
  } catch (err) {
    logger.error("Failed to fetch blogs", { error: err });
    return jsonResponse(req, { error: "Failed to fetch blogs" }, { status: 500 });
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

  const parsed = createBlogSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid blog payload" },
      { status: 400 }
    );
  }

  const { title, description, imageUrl } = parsed.data;
  const user = guard.session!.user;
  const baseSlug = slugify(title);

  try {
    const created = await withDbContext(guard.dbCtx, async (client) => {
      let slug = baseSlug;
      const slugCheck = await client.query("SELECT 1 FROM blogs WHERE slug = $1", [slug]);
      if (slugCheck.rowCount && slugCheck.rowCount > 0) {
        slug = `${baseSlug}-${Date.now().toString(36)}`;
      }

      const res = await client.query(
        `INSERT INTO blogs (slug, title, description, image_url, publisher_id, publisher_name)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, slug, title, description, image_url, publisher_name, created_at, updated_at`,
        [slug, title, description, imageUrl, user.id, user.name]
      );

      await writeAuditLog(client, {
        actorId: user.id,
        action: "blog.created",
        resourceType: "blog",
        resourceId: res.rows[0].id,
        metadata: { title, slug },
      });

      await createNotification(
        {
          audience: "members",
          category: "post",
          title: `New Post: ${title}`,
          body: `Published by ${user.name}. Tap to read the full article.`,
          link: `/posts/${encodeURIComponent(slug)}`,
          createdBy: user.id,
        },
        client
      );

      return res.rows[0];
    });

    return jsonResponse(req, created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create blog", { error: err });
    return jsonResponse(req, { error: "Failed to create blog" }, { status: 500 });
  }
}
