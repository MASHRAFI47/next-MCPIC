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
import LoadingSpinner from "@/components/LoadingSpinner";
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

export default function PostsPage() {
  const [search, setSearch] = useState("");
  const [activePost, setActivePost] = useState<BlogRecord | null>(null);

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: () => apiFetch<BlogRecord[]>("/api/blogs"),
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
            <label className="input input-bordered bg-[#0b1514] border-[#17403b] focus-within:border-[#30c4b6] flex items-center gap-2 rounded-2xl">
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

        {isLoading ? (
          <LoadingSpinner />
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
                <article className="group grid grid-cols-1 md:grid-cols-12 bg-[#0b1514] border border-[#122e2a] hover:border-[#30c4b6]/60 rounded-2xl overflow-hidden transition-colors shadow-xl">
                  <div className="md:col-span-6 relative min-h-[260px] md:min-h-[340px] bg-[#060d0c] overflow-hidden">
                    <Image
                      src={featuredPost.image_url}
                      alt={featuredPost.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 45vw"
                      unoptimized={featuredPost.image_url.startsWith("/api/uploads/")}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-4 left-4 font-mono text-[11px] uppercase tracking-widest px-3 py-1 rounded-full bg-[#30c4b6] text-[#080f0e] font-semibold">
                      Latest Post
                    </span>
                  </div>

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

                      <h2 className="text-3xl md:text-4xl text-[#e8f5f3] tracking-wide leading-tight">
                        {featuredPost.title}
                      </h2>

                      <p className="text-sm leading-relaxed line-clamp-5 whitespace-pre-wrap">
                        {featuredPost.description}
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setActivePost(featuredPost)}
                        className="btn btn-sm border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92] rounded-xl"
                      >
                        Read Full Post <MdArrowRightAlt size={18} />
                      </button>
                    </div>
                  </div>
                </article>
              )}

              {/* Remaining Posts Grid */}
              {gridPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gridPosts.map((blog) => (
                    <article
                      key={blog.id}
                      className="group card bg-[#0b1514] border border-[#122e2a] hover:border-[#30c4b6]/60 rounded-2xl overflow-hidden transition-colors flex flex-col"
                    >
                      <div className="relative h-52 w-full bg-[#060d0c] overflow-hidden">
                        <Image
                          src={blog.image_url}
                          alt={blog.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 40vw"
                          unoptimized={blog.image_url.startsWith("/api/uploads/")}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>

                      <div className="card-body p-6 flex flex-col justify-between gap-4 flex-1">
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#89aca8]">
                            <span className="text-[#30c4b6]">{blog.publisher_name}</span>
                            <span>·</span>
                            <span>{formatPublishDate(blog.created_at)}</span>
                            <span>·</span>
                            <span>{estimateReadMinutes(blog.description)} min</span>
                          </div>

                          <h3 className="text-2xl text-[#e8f5f3] tracking-wide leading-snug line-clamp-2">
                            {blog.title}
                          </h3>

                          <p className="text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">
                            {blog.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#122e2a] flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setActivePost(blog)}
                            className="text-xs font-mono uppercase tracking-wider text-[#30c4b6] hover:text-[#e8f5f3] flex items-center gap-1 transition-colors"
                          >
                            Read Article <MdArrowRightAlt size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Clean Sticky Community Sidebar */}
            <aside className="lg:col-span-3 space-y-5 lg:sticky lg:top-24">
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
            </aside>
          </div>
        )}
      </div>

      {/* Full Post Reader Modal */}
      {activePost && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activePost.title}
          onClick={() => setActivePost(null)}
        >
          <article
            className="bg-[#0b1514] border border-[#17403b] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0b1514]/95 backdrop-blur border-b border-[#122e2a]">
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#89aca8]">
                <span className="text-[#30c4b6] flex items-center gap-1.5">
                  <FaUserEdit /> {activePost.publisher_name}
                </span>
                <span>·</span>
                <span>{formatPublishDate(activePost.created_at)}</span>
                <span>·</span>
                <span>{estimateReadMinutes(activePost.description)} min read</span>
              </div>
              <button
                type="button"
                aria-label="Close post"
                onClick={() => setActivePost(null)}
                className="btn btn-sm btn-circle btn-ghost text-[#e8f5f3]"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <h2 className="text-3xl md:text-4xl text-[#e8f5f3] tracking-wide leading-tight">
                {activePost.title}
              </h2>

              <div className="relative w-full h-64 sm:h-96 rounded-xl overflow-hidden bg-[#060d0c] border border-[#122e2a]">
                <Image
                  src={activePost.image_url}
                  alt={activePost.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  unoptimized={activePost.image_url.startsWith("/api/uploads/")}
                  className="object-contain"
                />
              </div>

              <div className="text-sm sm:text-base leading-7 text-[#c5dbd8] whitespace-pre-wrap break-words">
                {activePost.description}
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
