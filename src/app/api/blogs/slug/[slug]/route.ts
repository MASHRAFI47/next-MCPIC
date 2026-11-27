import { withDbContext } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: { params: { slug: string } }
) {
  const guard = await guardRequest(req, { auth: "none", csrf: false });
  if (!guard.ok) return guard.response;

  const slug = context.params.slug?.trim().toLowerCase();
  if (!slug || slug.length > 160) {
    return jsonResponse(req, { error: "Invalid post slug" }, { status: 400 });
  }

  try {
    const blog = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `SELECT id, slug, title, description, image_url, publisher_name, created_at, updated_at
         FROM blogs WHERE slug = $1 LIMIT 1`,
        [slug]
      );
      return res.rows[0] ?? null;
    });

    if (!blog) {
      return jsonResponse(req, { error: "Post not found" }, { status: 404 });
    }

    return jsonResponse(req, blog);
  } catch (err) {
    logger.error("Failed to fetch post by slug", { error: err });
    return jsonResponse(req, { error: "Failed to fetch post" }, { status: 500 });
  }
}
