"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import { GoHorizontalRule } from "react-icons/go";
import Title from "@/components/Title";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiFetch } from "@/lib/api-client";
import type { BlogRecord } from "@/types/models";

const PREVIEW_LIMIT = 450;

export default function PostsPage() {
  // Independent per-post expand state (fixes legacy bug where one click expanded every post)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: () => apiFetch<BlogRecord[]>("/api/blogs"),
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="min-h-screen px-6 md:px-10 lg:px-4 py-12 hero-grid">
        <div className="container mx-auto">
          <div className="flex flex-col gap-3">
            <p className="tags text-[11px] pt-2 flex items-center font-semibold tracking-widest gap-2">
              <GoHorizontalRule className="scale-x-150" /> RECENT UPDATES
            </p>
            <Title className="uppercase">POSTS SECTION</Title>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-10">
              <div className="md:col-span-3 space-y-10">
                {blogs.length === 0 ? (
                  <p className="text-[#89aca8]">No posts published yet.</p>
                ) : (
                  blogs.map((blog) => {
                    const isExpanded = expandedIds.has(blog.id);
                    const isLong = blog.description.length > PREVIEW_LIMIT;
                    const text =
                      !isLong || isExpanded
                        ? blog.description
                        : `${blog.description.slice(0, PREVIEW_LIMIT)}...`;
                    const date = new Date(blog.created_at);
                    const formattedDate = isValid(date)
                      ? format(date, "MMMM do yyyy, h:mm a")
                      : "";

                    return (
                      <article
                        key={blog.id}
                        className="border border-[#122e2a] bg-[#0b1514] rounded-xl p-6 space-y-4"
                        data-aos="fade-in"
                      >
                        <h2 className="text-3xl text-[#e8f5f3] tracking-wide">{blog.title}</h2>
                        <p className="text-sm">
                          <span className="text-[#30c4b6] font-bold">Publisher: </span>
                          {blog.publisher_name}
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          <span className="text-[#30c4b6] font-bold">Description: </span>
                          {text}
                        </p>

                        {isLong && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(blog.id)}
                            className="font-semibold text-[#a89ec9] hover:text-[#30c4b6] text-xs cursor-pointer"
                          >
                            {isExpanded ? "See Less" : "See More"}
                          </button>
                        )}

                        {formattedDate && (
                          <p className="text-xs">
                            <span className="text-[#30c4b6] font-bold">Published: </span>
                            {formattedDate}
                          </p>
                        )}

                        <div className="relative w-full h-[20rem] md:h-[32rem] rounded-lg overflow-hidden bg-black/20">
                          <Image
                            src={blog.image_url}
                            fill
                            sizes="(max-width: 768px) 100vw, 75vw"
                            unoptimized={blog.image_url.startsWith("/api/uploads/")}
                            className="object-cover md:object-contain"
                            alt={blog.title}
                          />
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              <aside className="hidden md:block">
                <div className="sticky top-24 space-y-4 flex flex-col items-end">
                  <a
                    href="https://www.facebook.com/ictclub.mcpsc"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image
                      src="/images/follow/followfb.webp"
                      width={160}
                      height={160}
                      className="w-40 h-auto rounded-lg border border-[#122e2a]"
                      alt="Follow MCPIC on Facebook"
                    />
                  </a>
                  <a
                    href="https://www.instagram.com/ictclub.mcpsc/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image
                      src="/images/follow/followinsta.jpeg"
                      width={160}
                      height={160}
                      className="w-40 h-auto rounded-lg border border-[#122e2a]"
                      alt="Follow MCPIC on Instagram"
                    />
                  </a>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
  );
}
