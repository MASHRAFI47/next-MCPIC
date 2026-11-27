"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { GoHorizontalRule } from "react-icons/go";
import { FaChevronLeft, FaChevronRight, FaExpandAlt, FaTrophy, FaTimes } from "react-icons/fa";
import Title from "@/components/Title";
import Reveal from "@/components/Reveal";
import { apiFetch } from "@/lib/api-client";
import type { AchievementRecord } from "@/types/models";

interface DisplayAchievement {
  id: string;
  src: string;
  title: string;
  tag: string;
  year?: string | null;
}

const FALLBACK_ACHIEVEMENTS: DisplayAchievement[] = [
  { id: "1", src: "/images/achievements/achievement1.jpg", title: "Inter-College IT Olympiad Triumph", tag: "National Recognition" },
  { id: "2", src: "/images/achievements/achievement2.jpg", title: "Tech Fest Championship Showcase", tag: "Team Excellence" },
  { id: "3", src: "/images/achievements/achievement3.jpg", title: "Programming & Problem Solving", tag: "Coding Arena" },
  { id: "4", src: "/images/achievements/achievement4.jpg", title: "Creative Design & Multimedia Award", tag: "Digital Arts" },
  { id: "5", src: "/images/achievements/achievement5.jpg", title: "Institutional Innovation Honors", tag: "Innovation" },
  { id: "6", src: "/images/achievements/achievement6.jpg", title: "MCPIC Flagship Competition Moments", tag: "Community Pride" },
  { id: "7", src: "/images/achievements/achievement7.jpeg", title: "Rising Tech Leaders Recognition", tag: "Hall of Fame" },
];

function getBentoClasses(index: number, total: number): { span: string; height: string } {
  if (total === 7) {
    if (index === 0) return { span: "lg:col-span-7", height: "h-72 sm:h-80 lg:h-96" };
    if (index === 1) return { span: "lg:col-span-5", height: "h-72 sm:h-80 lg:h-96" };
    if (index >= 2 && index <= 4) return { span: "lg:col-span-4", height: "h-64 sm:h-72" };
    return { span: "lg:col-span-6", height: "h-64 sm:h-72" };
  }
  if (index === 0) return { span: "lg:col-span-7", height: "h-72 sm:h-80 lg:h-96" };
  if (index === 1) return { span: "lg:col-span-5", height: "h-72 sm:h-80 lg:h-96" };
  return { span: "lg:col-span-4", height: "h-64 sm:h-72" };
}

export default function Achievements({
  initialAchievements,
}: {
  initialAchievements?: AchievementRecord[];
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(() => new Set());

  const { data: dbAchievements } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => apiFetch<AchievementRecord[]>("/api/achievements"),
    initialData: initialAchievements && initialAchievements.length > 0 ? initialAchievements : undefined,
    staleTime: 120_000,
  });

  const items: DisplayAchievement[] = useMemo(() => {
    if (dbAchievements && dbAchievements.length > 0) {
      return dbAchievements.map((a) => ({
        id: a.id,
        src: a.image_url,
        title: a.title,
        tag: a.tag,
        year: a.year,
      }));
    }
    return FALLBACK_ACHIEVEMENTS;
  }, [dbAchievements]);

  const markLoaded = useCallback((id: string) => {
    setLoadedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const closeModal = useCallback(() => setActiveIndex(null), []);

  const showPrev = useCallback(() => {
    setActiveIndex((prev) =>
      prev === null ? null : (prev - 1 + items.length) % items.length
    );
  }, [items.length]);

  const showNext = useCallback(() => {
    setActiveIndex((prev) => (prev === null ? null : (prev + 1) % items.length));
  }, [items.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, closeModal, showPrev, showNext]);

  const activeItem = activeIndex !== null ? items[activeIndex] : null;
  const prevItem =
    activeIndex !== null ? items[(activeIndex - 1 + items.length) % items.length] : null;
  const nextItem =
    activeIndex !== null ? items[(activeIndex + 1) % items.length] : null;
  const isActiveLoaded = activeItem ? loadedIds.has(activeItem.id) : false;

  return (
    <section className="bg-gradient-radial from-[#080f0e] via-[#0b1514] to-[#080f0e] border-y-2 border-[#112927] py-20">
      <div className="container mx-auto px-6 md:px-10 lg:px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <Reveal direction="up">
            <div className="flex flex-col gap-3">
              <p className="tags text-[11px] pt-2 flex items-center font-semibold tracking-widest gap-2">
                <GoHorizontalRule className="scale-x-150" /> BRILLIANT MINDS
              </p>
              <Title>ACHIEVEMENTS</Title>
              <p className="text-[0.95rem] max-w-xl">
                Moments of excellence — awards, fests, and milestones earned by MCPIC members across
                institutions.
              </p>
            </div>
          </Reveal>

          <Reveal direction="left" delay={120}>
            <div className="flex items-center gap-3 self-start md:self-auto bg-[#0c1917] border border-[#17403b] rounded-2xl px-5 py-3 shadow-lg shadow-[#30c4b6]/5">
              <FaTrophy className="text-[#30c4b6] shrink-0" size={20} />
              <div>
                <span className="font-mono text-xs text-[#30c4b6] block tracking-widest">
                  HALL OF FAME
                </span>
                <span className="text-sm text-[#e8f5f3] font-semibold">
                  {items.length} Featured Highlights
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5">
          {items.map((item, idx) => {
            const { span, height } = getBentoClasses(idx, items.length);
            return (
              <Reveal
                key={item.id}
                direction="zoom"
                delay={(idx % 4) * 80}
                className={span}
              >
                <button
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`keep-dark group relative w-full overflow-hidden rounded-2xl border border-[#122e2a] hover:border-[#30c4b6]/70 bg-[#0c1917] text-left transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#30c4b6]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30c4b6] ${height}`}
                >
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 45vw"
                  unoptimized={item.src.startsWith("/api/uploads/")}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#060d0c]/90 via-[#060d0c]/25 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-widest px-3 py-1 rounded-full bg-[#080f0e]/80 backdrop-blur-sm border border-[#17403b] text-[#30c4b6]">
                    {item.tag}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-[#080f0e]/80 backdrop-blur-sm border border-[#17403b] text-[#e8f5f3] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FaExpandAlt size={12} />
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <span className="font-mono text-[10px] text-[#30c4b6] tracking-widest">
                    {String(idx + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                    {item.year ? ` · ${item.year}` : ""}
                  </span>
                  <h3 className="text-xl sm:text-2xl text-[#e8f5f3] tracking-wide leading-tight mt-0.5">
                    {item.title}
                  </h3>
                </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>

      {activeItem && activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
          onClick={closeModal}
        >
          <div
            className="animate-modal-in relative w-full max-w-4xl bg-[#0b1514] border border-[#17403b] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#122e2a]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#30c4b6]">
                  {activeItem.tag} · {activeIndex + 1} / {items.length}
                </span>
                <h3 className="text-2xl text-[#e8f5f3]">{activeItem.title}</h3>
              </div>
              <button
                type="button"
                aria-label="Close lightbox"
                onClick={closeModal}
                className="btn btn-sm btn-circle btn-ghost text-[#e8f5f3]"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="keep-dark relative w-full h-[55vh] sm:h-[68vh] bg-[#060d0c]">
              {!isActiveLoaded && (
                <div className="absolute inset-0 z-[1] p-6">
                  <div className="w-full h-full rounded-xl bg-gradient-to-r from-[#0c1917] via-[#132c28] to-[#0c1917] animate-pulse border border-[#17403b]/60" />
                </div>
              )}

              <Image
                key={activeItem.id}
                src={activeItem.src}
                alt={activeItem.title}
                fill
                priority
                quality={80}
                sizes="(max-width: 896px) 95vw, 896px"
                unoptimized={activeItem.src.startsWith("/api/uploads/")}
                onLoad={() => markLoaded(activeItem.id)}
                className={`object-contain p-2 transition-opacity duration-200 ${
                  isActiveLoaded ? "opacity-100" : "opacity-0"
                }`}
              />

              {prevItem && prevItem.id !== activeItem.id && (
                <div className="sr-only" aria-hidden="true">
                  <Image
                    src={prevItem.src}
                    alt=""
                    fill
                    priority
                    quality={80}
                    sizes="(max-width: 896px) 95vw, 896px"
                    unoptimized={prevItem.src.startsWith("/api/uploads/")}
                    onLoad={() => markLoaded(prevItem.id)}
                  />
                </div>
              )}
              {nextItem && nextItem.id !== activeItem.id && nextItem.id !== prevItem?.id && (
                <div className="sr-only" aria-hidden="true">
                  <Image
                    src={nextItem.src}
                    alt=""
                    fill
                    priority
                    quality={80}
                    sizes="(max-width: 896px) 95vw, 896px"
                    unoptimized={nextItem.src.startsWith("/api/uploads/")}
                    onLoad={() => markLoaded(nextItem.id)}
                  />
                </div>
              )}

              <button
                type="button"
                aria-label="Previous achievement"
                onClick={showPrev}
                className="btn btn-circle btn-sm z-10 bg-[#0b1514]/85 border-[#17403b] text-[#e8f5f3] hover:bg-[#30c4b6] hover:text-[#080f0e] absolute left-3 top-1/2 -translate-y-1/2"
              >
                <FaChevronLeft />
              </button>
              <button
                type="button"
                aria-label="Next achievement"
                onClick={showNext}
                className="btn btn-circle btn-sm z-10 bg-[#0b1514]/85 border-[#17403b] text-[#e8f5f3] hover:bg-[#30c4b6] hover:text-[#080f0e] absolute right-3 top-1/2 -translate-y-1/2"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
