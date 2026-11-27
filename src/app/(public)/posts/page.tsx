import PostsClient from "@/components/PublicPages/PostsClient";
import { queryPublic } from "@/lib/db";
import type { BlogRecord } from "@/types/models";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Posts",
};

function toIso(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  return typeof val === "string" ? val : "";
}

export default async function PostsPage() {
  const rows = await queryPublic(
    `SELECT id, slug, title, description, image_url, publisher_id, publisher_name, created_at, updated_at
     FROM blogs
     ORDER BY created_at DESC`
  ).catch(() => []);

  const initialBlogs: BlogRecord[] = rows.map((b) => ({
    id: String(b.id),
    slug: String(b.slug),
    title: String(b.title),
    description: String(b.description),
    image_url: String(b.image_url),
    publisher_id: b.publisher_id ? String(b.publisher_id) : null,
    publisher_name: String(b.publisher_name),
    created_at: toIso(b.created_at),
    updated_at: toIso(b.updated_at),
  }));

  return <PostsClient initialBlogs={initialBlogs} />;
}
