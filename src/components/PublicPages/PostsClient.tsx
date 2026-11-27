"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import { GoHorizontalRule } from "react-icons/go";
import {
  FaCalendarAlt,
  FaClock,
  FaFacebook,
  FaInstagram,
  FaSearch,
  FaTimes,
  FaUserEdit,
} from "react-icons/fa";
import { MdArrowRightAlt } from "react-icons/md";
import Title from "@/components/Title";
import Reveal from "@/components/Reveal";
import SharePostButton from "@/components/SharePostButton";
import { PostsPageSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";
import type { BlogRecord } from "@/types/models";

function formatPublishDate(value: string): string {
  const d = new Date(value);
  return isValid(d) ? format(d, "MMM d, yyyy") : "";
}

function estimateReadMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

export default function PostsClient({ initialBlogs }: { initialBlogs: BlogRecord[] }) {
  const [search, setSearch] = useState("");

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: () => apiFetch<BlogRecord[]>("/api/blogs"),
    initialData: initialBlogs,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return blogs;
    return blogs.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.publisher_name.toLowerCase().includes(q)
    );
  }, [blogs, search]);

  const featuredPost = !search.trim() && filtered.length > 0 ? filtered[0] : null;
  const gridPosts = featuredPost ? filtered.slice(1) : filtered;

  return (
    <section className="min-h-screen px-6 md:px-10 lg:px-4 py-14 hero-grid">
      <div className="container mx-auto space-y-10">
        {/* Header + Search */}
        <Reveal direction="up" immediate>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="flex flex-col gap-3">
              <p className="tags text-[11px] pt-2 flex items-center font-semibold tracking-widest gap-2">
                <GoHorizontalRule className="scale-x-150" /> CLUB JOURNAL &amp; ANNOUNCEMENTS
              </p>
              <Title className="uppercase">POSTS &amp; UPDATES</Title>
              <p className="text-[0.95rem] max-w-xl">
                Stories, announcements, event recaps, and technical write-ups from the MCPIC team.
              </p>
            </div>

            <div className="w-full lg:w-80">
              <label className="input input-bordered bg-[#0b1514] border-[#17403b] focus-within:border-[#30c4b6] flex items-center gap-2 rounded-2xl transition-colors">
                <FaSearch className="text-[#4a6564]" size={14} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search posts or authors..."
                  className="grow text-sm text-[#e8f5f3] placeholder:text-[#4a6564]"
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                    className="text-[#89aca8] hover:text-white"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </label>
            </div>
          </div>
        </Reveal>

        {isLoading ? (
          <PostsPageSkeleton />
        ) : filtered.length === 0 ? (
          <div className="card bg-[#0b1514] border border-[#122e2a] p-12 text-center space-y-3">
            <h2 className="text-3xl text-[#e8f5f3]">
              {search ? "No Matching Posts" : "No Posts Published Yet"}
            </h2>
            <p className="text-sm">
              {search
                ? "Try a different keyword or clear your search filter."
                : "Check back soon for new club announcements and articles."}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="btn btn-sm mx-auto border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
              >
                Reset Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Editorial Feed */}
            <div className="lg:col-span-9 space-y-8">
              {/* Featured Latest Post */}
              {featuredPost && (
                <Reveal direction="up" delay={60} immediate>
                  <article className="group grid grid-cols-1 md:grid-cols-12 bg-[#0b1514] border border-[#122e2a] hover:border-[#30c4b6]/60 rounded-2xl overflow-hidden transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 shadow-xl hover:shadow-[#30c4b6]/10">
                    <Link
                      href={`/posts/${encodeURIComponent(featuredPost.slug)}`}
                      className="md:col-span-6 relative min-h-[260px] md:min-h-[340px] bg-[#060d0c] overflow-hidden block"
                    >
                      <Image
                        src={featuredPost.image_url}
                        alt={featuredPost.title}
                        fill
                        priority
                        sizes="(max-width: 768px) 100vw, 45vw"
                        unoptimized={featuredPost.image_url.startsWith("/api/uploads/")}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-4 left-4 font-mono text-[11px] uppercase tracking-widest px-3 py-1 rounded-full bg-[#30c4b6] text-[#080f0e] font-semibold">
                        Latest Post
                      </span>
                    </Link>

                    <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#89aca8]">
                          <span className="flex items-center gap-1.5 text-[#30c4b6]">
                            <FaUserEdit /> {featuredPost.publisher_name}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <FaCalendarAlt /> {formatPublishDate(featuredPost.created_at)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <FaClock /> {estimateReadMinutes(featuredPost.description)} min read
                          </span>
                        </div>

                        <Link href={`/posts/${encodeURIComponent(featuredPost.slug)}`}>
                          <h2 className="text-3xl md:text-4xl text-[#e8f5f3] hover:text-[#30c4b6] transition-colors tracking-wide leading-tight">
                            {featuredPost.title}
                          </h2>
                        </Link>

                        <p className="text-sm leading-relaxed line-clamp-5 whitespace-pre-wrap">
                          {featuredPost.description}
                        </p>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                        <Link
                          href={`/posts/${encodeURIComponent(featuredPost.slug)}`}
                          className="btn btn-sm border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92] rounded-xl"
                        >
                          Read Full Post <MdArrowRightAlt size={18} />
                        </Link>
                        <SharePostButton slug={featuredPost.slug} compact />
                      </div>
                    </div>
                  </article>
                </Reveal>
              )}

              {/* Remaining Posts Grid */}
              {gridPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gridPosts.map((blog, idx) => (
                    <Reveal key={blog.id} direction="up" delay={(idx % 2) * 80} className="h-full">
                      <article className="group card bg-[#0b1514] border border-[#122e2a] hover:border-[#30c4b6]/60 rounded-2xl overflow-hidden transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#30c4b6]/10 flex flex-col h-full">
                        <Link
                          href={`/posts/${encodeURIComponent(blog.slug)}`}
                          className="relative h-52 w-full bg-[#060d0c] overflow-hidden block"
                        >
                          <Image
                            src={blog.image_url}
                            alt={blog.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 40vw"
                            unoptimized={blog.image_url.startsWith("/api/uploads/")}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </Link>

                        <div className="card-body p-6 flex flex-col justify-between gap-4 flex-1">
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#89aca8]">
                              <span className="text-[#30c4b6]">{blog.publisher_name}</span>
                              <span>·</span>
                              <span>{formatPublishDate(blog.created_at)}</span>
                              <span>·</span>
                              <span>{estimateReadMinutes(blog.description)} min</span>
                            </div>

                            <Link href={`/posts/${encodeURIComponent(blog.slug)}`}>
                              <h3 className="text-2xl text-[#e8f5f3] hover:text-[#30c4b6] transition-colors tracking-wide leading-snug line-clamp-2">
                                {blog.title}
                              </h3>
                            </Link>

                            <p className="text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">
                              {blog.description}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-[#122e2a] flex items-center justify-between">
                            <Link
                              href={`/posts/${encodeURIComponent(blog.slug)}`}
                              className="text-xs font-mono uppercase tracking-wider text-[#30c4b6] hover:text-[#e8f5f3] flex items-center gap-1 transition-colors"
                            >
                              Read Article <MdArrowRightAlt size={16} />
                            </Link>
                            <SharePostButton slug={blog.slug} compact />
                          </div>
                        </div>
                      </article>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>

            {/* Clean Sticky Community Sidebar */}
            <aside className="lg:col-span-3 lg:sticky lg:top-24">
              <Reveal direction="left" delay={120} immediate className="space-y-5">
                <div className="card bg-[#0b1514] border border-[#122e2a] rounded-2xl p-6 space-y-4">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-[#30c4b6]">
                    Connect With MCPIC
                  </span>
                  <h3 className="text-2xl text-[#e8f5f3] leading-tight">
                    Follow Our Community
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Stay updated with live fest announcements, workshops, and club highlights on our
                    official channels.
                  </p>

                  <div className="space-y-2.5 pt-1">
                    <a
                      href="https://www.facebook.com/ictclub.mcpsc"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0d1c1a] border border-[#17403b] hover:border-[#30c4b6] text-sm text-[#e8f5f3] transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <FaFacebook className="text-[#30c4b6]" size={18} />
                        Facebook Page
                      </span>
                      <MdArrowRightAlt className="text-[#89aca8]" size={18} />
                    </a>

                    <a
                      href="https://www.instagram.com/ictclub.mcpsc/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0d1c1a] border border-[#17403b] hover:border-[#30c4b6] text-sm text-[#e8f5f3] transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <FaInstagram className="text-[#30c4b6]" size={18} />
                        Instagram
                      </span>
                      <MdArrowRightAlt className="text-[#89aca8]" size={18} />
                    </a>
                  </div>
                </div>

                <div className="card bg-[#0b1514] border border-[#122e2a] rounded-2xl p-6 space-y-3">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-[#30c4b6]">
                    Explore More
                  </span>
                  <div className="flex flex-col gap-2 text-sm">
                    <Link href="/events" className="text-[#89aca8] hover:text-[#30c4b6] transition-colors">
                      → Upcoming &amp; Past Events
                    </Link>
                    <Link href="/executives" className="text-[#89aca8] hover:text-[#30c4b6] transition-colors">
                      → Executive Committee
                    </Link>
                    <Link href="/contact" className="text-[#89aca8] hover:text-[#30c4b6] transition-colors">
                      → Contact the Club
                    </Link>
                  </div>
                </div>
              </Reveal>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
