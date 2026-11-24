import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { updateBlogSchema, uuidSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const guard = await guardRequest(req, { auth: "none", csrf: false });
  if (!guard.ok) return guard.response;

  const parsedId = uuidSchema.safeParse(context.params.id);
  if (!parsedId.success) {
    return jsonResponse(req, { error: "Invalid blog ID" }, { status: 400 });
  }

  try {
    const blog = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `SELECT id, title, description, image_url, publisher_name, created_at, updated_at
         FROM blogs WHERE id = $1 LIMIT 1`,
        [parsedId.data]
      );
      return res.rows[0] ?? null;
    });

    if (!blog) {
      return jsonResponse(req, { error: "Blog not found" }, { status: 404 });
    }

    return jsonResponse(req, blog);
  } catch (err) {
    logger.error("Failed to fetch blog", { error: err });
    return jsonResponse(req, { error: "Failed to fetch blog" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: { id: string } }
) {
  const guard = await guardRequest(req, {
    auth: "admin",
    rateLimit: "write",
    csrf: true,
  });
  if (!guard.ok) return guard.response;

  const parsedId = uuidSchema.safeParse(context.params.id);
  if (!parsedId.success) {
    return jsonResponse(req, { error: "Invalid blog ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateBlogSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid blog payload" },
      { status: 400 }
    );
  }

  const { title, description, imageUrl } = parsed.data;

  try {
    const updated = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        `UPDATE blogs
         SET title = $1, description = $2, image_url = $3
         WHERE id = $4
         RETURNING id, title, description, image_url, publisher_name, created_at, updated_at`,
        [title, description, imageUrl, parsedId.data]
      );
      const row = res.rows[0];
      if (!row) return null;

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "blog.updated",
        resourceType: "blog",
        resourceId: row.id,
      });

      return row;
    });

    if (!updated) {
      return jsonResponse(req, { error: "Blog not found" }, { status: 404 });
    }

    return jsonResponse(req, updated);
  } catch (err) {
    logger.error("Failed to update blog", { error: err });
    return jsonResponse(req, { error: "Failed to update blog" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  const guard = await guardRequest(req, {
    auth: "admin",
    rateLimit: "write",
    csrf: true,
  });
  if (!guard.ok) return guard.response;

  const parsedId = uuidSchema.safeParse(context.params.id);
  if (!parsedId.success) {
    return jsonResponse(req, { error: "Invalid blog ID" }, { status: 400 });
  }

  try {
    const deleted = await withDbContext(guard.dbCtx, async (client) => {
      const res = await client.query(
        "DELETE FROM blogs WHERE id = $1 RETURNING id, title",
        [parsedId.data]
      );
      const row = res.rows[0];
      if (!row) return null;

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "blog.deleted",
        resourceType: "blog",
        resourceId: row.id,
        metadata: { title: row.title },
      });

      return row;
    });

    if (!deleted) {
      return jsonResponse(req, { error: "Blog not found" }, { status: 404 });
    }

    return jsonResponse(req, { deleted: true, id: deleted.id });
  } catch (err) {
    logger.error("Failed to delete blog", { error: err });
    return jsonResponse(req, { error: "Failed to delete blog" }, { status: 500 });
  }
}
