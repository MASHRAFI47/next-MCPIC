import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format, isValid } from "date-fns";
import { withDbContext } from "@/lib/db";
import SharePostButton from "@/components/SharePostButton";

export const dynamic = "force-dynamic";

interface BlogRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_url: string;
  publisher_name: string;
  created_at: Date;
  updated_at: Date;
}

async function getPostBySlug(slug: string): Promise<BlogRow | null> {
  const clean = slug.trim().toLowerCase();
  if (!clean || clean.length > 160) return null;

  return withDbContext({ role: "anonymous" }, async (client) => {
    const res = await client.query<BlogRow>(
      `SELECT id, slug, title, description, image_url, publisher_name, created_at, updated_at
       FROM blogs WHERE slug = $1 LIMIT 1`,
      [clean]
    );
    return res.rows[0] ?? null;
  }).catch(() => null);
}

async function getRelatedPosts(excludeId: string): Promise<BlogRow[]> {
  return withDbContext({ role: "anonymous" }, async (client) => {
    const res = await client.query<BlogRow>(
      `SELECT id, slug, title, description, image_url, publisher_name, created_at, updated_at
       FROM blogs
       WHERE id <> $1
       ORDER BY created_at DESC
       LIMIT 3`,
      [excludeId]
    );
    return res.rows;
  }).catch(() => []);
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return { title: "Post Not Found" };
  }

  const excerpt =
    post.description.length > 160
      ? `${post.description.slice(0, 157).trim()}...`
      : post.description;

  return {
    title: post.title,
    description: excerpt,
    openGraph: {
      title: `${post.title} | MCPIC`,
      description: excerpt,
      type: "article",
      publishedTime: new Date(post.created_at).toISOString(),
      authors: [post.publisher_name],
      images: post.image_url ? [{ url: post.image_url, alt: post.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | MCPIC`,
      description: excerpt,
      images: post.image_url ? [post.image_url] : [],
    },
  };
}

export default async function SinglePostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    notFound();
  }

  const related = await getRelatedPosts(post.id);
  const pubDate = new Date(post.created_at);
  const formattedDate = isValid(pubDate) ? format(pubDate, "MMMM d, yyyy") : "";
  const readMins = Math.max(1, Math.ceil(post.description.trim().split(/\s+/).length / 180));

  return (
    <section className="min-h-screen hero-grid py-12 px-6 md:px-10 lg:px-4">
      <div className="container mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/posts"
            className="text-xs font-mono uppercase tracking-widest text-[#30c4b6] hover:text-[#e8f5f3]"
          >
            ← Back to All Posts
          </Link>
          <SharePostButton slug={post.slug} />
        </div>

        <article className="bg-[#0b1514] border border-[#122e2a] rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 md:p-10 space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#89aca8]">
              <span className="text-[#30c4b6]">{post.publisher_name}</span>
              {formattedDate && (
                <>
                  <span>·</span>
                  <span>{formattedDate}</span>
                </>
              )}
              <span>·</span>
              <span>{readMins} min read</span>
            </div>

            <h1 className="text-4xl md:text-5xl text-[#e8f5f3] tracking-wide leading-tight">
              {post.title}
            </h1>

            <div className="relative w-full h-64 sm:h-[26rem] rounded-xl overflow-hidden bg-[#060d0c] border border-[#122e2a]">
              <Image
                src={post.image_url}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 896px) 100vw, 832px"
                unoptimized={post.image_url.startsWith("/api/uploads/")}
                className="object-contain"
              />
            </div>

            <div className="text-sm sm:text-base leading-8 text-[#c5dbd8] whitespace-pre-wrap break-words pt-2">
              {post.description}
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <div className="pt-6 space-y-4">
            <h2 className="text-2xl text-[#e8f5f3] tracking-wide">More From MCPIC</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/posts/${encodeURIComponent(item.slug)}`}
                  className="group bg-[#0b1514] border border-[#122e2a] hover:border-[#30c4b6]/60 rounded-xl overflow-hidden transition-colors"
                >
                  <div className="relative h-36 w-full bg-[#060d0c]">
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      unoptimized={item.image_url.startsWith("/api/uploads/")}
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl text-[#e8f5f3] line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs mt-1 text-[#89aca8]">{item.publisher_name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
