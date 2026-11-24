"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { GoHorizontalRule } from "react-icons/go";
import { FaChevronLeft, FaChevronRight, FaExpandAlt, FaTrophy, FaTimes } from "react-icons/fa";
import Title from "@/components/Title";

interface AchievementItem {
  id: number;
  src: string;
  title: string;
  tag: string;
  spanClass: string;
  heightClass: string;
}

const ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 1,
    src: "/images/achievements/achievement1.jpg",
    title: "Inter-College IT Olympiad Triumph",
    tag: "National Recognition",
    spanClass: "lg:col-span-7",
    heightClass: "h-72 sm:h-80 lg:h-96",
  },
  {
    id: 2,
    src: "/images/achievements/achievement2.jpg",
    title: "Tech Fest Championship Showcase",
    tag: "Team Excellence",
    spanClass: "lg:col-span-5",
    heightClass: "h-72 sm:h-80 lg:h-96",
  },
  {
    id: 3,
    src: "/images/achievements/achievement3.jpg",
    title: "Programming & Problem Solving",
    tag: "Coding Arena",
    spanClass: "lg:col-span-4",
    heightClass: "h-64 sm:h-72",
  },
  {
    id: 4,
    src: "/images/achievements/achievement4.jpg",
    title: "Creative Design & Multimedia Award",
    tag: "Digital Arts",
    spanClass: "lg:col-span-4",
    heightClass: "h-64 sm:h-72",
  },
  {
    id: 5,
    src: "/images/achievements/achievement5.jpg",
    title: "Institutional Innovation Honors",
    tag: "Innovation",
    spanClass: "lg:col-span-4",
    heightClass: "h-64 sm:h-72",
  },
  {
    id: 6,
    src: "/images/achievements/achievement6.jpg",
    title: "MCPIC Flagship Competition Moments",
    tag: "Community Pride",
    spanClass: "lg:col-span-6",
    heightClass: "h-64 sm:h-72",
  },
  {
    id: 7,
    src: "/images/achievements/achievement7.jpeg",
    title: "Rising Tech Leaders Recognition",
    tag: "Hall of Fame",
    spanClass: "lg:col-span-6",
    heightClass: "h-64 sm:h-72",
  },
];

export default function Achievements() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loadedIds, setLoadedIds] = useState<Set<number>>(() => new Set());

  const markLoaded = useCallback((id: number) => {
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
      prev === null ? null : (prev - 1 + ACHIEVEMENTS.length) % ACHIEVEMENTS.length
    );
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex((prev) => (prev === null ? null : (prev + 1) % ACHIEVEMENTS.length));
  }, []);

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

  const activeItem = activeIndex !== null ? ACHIEVEMENTS[activeIndex] : null;
  const prevItem =
    activeIndex !== null
      ? ACHIEVEMENTS[(activeIndex - 1 + ACHIEVEMENTS.length) % ACHIEVEMENTS.length]
      : null;
  const nextItem =
    activeIndex !== null
      ? ACHIEVEMENTS[(activeIndex + 1) % ACHIEVEMENTS.length]
      : null;
  const isActiveLoaded = activeItem ? loadedIds.has(activeItem.id) : false;

  return (
    <section className="bg-gradient-radial from-[#080f0e] via-[#0b1514] to-[#080f0e] border-y-2 border-[#112927] py-20">
      <div className="container mx-auto px-6 md:px-10 lg:px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
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

          <div className="flex items-center gap-3 self-start md:self-auto bg-[#0c1917] border border-[#17403b] rounded-2xl px-5 py-3">
            <FaTrophy className="text-[#30c4b6] shrink-0" size={20} />
            <div>
              <span className="font-mono text-xs text-[#30c4b6] block tracking-widest">
                HALL OF FAME
              </span>
              <span className="text-sm text-[#e8f5f3] font-semibold">
                {ACHIEVEMENTS.length} Featured Highlights
              </span>
            </div>
          </div>
        </div>

        {/* Modern Bento Gallery Grid (7 items -> 2 + 3 + 2 balanced rows on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5">
          {ACHIEVEMENTS.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`group relative overflow-hidden rounded-2xl border border-[#122e2a] hover:border-[#30c4b6]/70 bg-[#0c1917] text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#30c4b6] ${item.spanClass} ${item.heightClass}`}
            >
              <Image
                src={item.src}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 45vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Dark gradient scrim for crisp readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#060d0c]/90 via-[#060d0c]/25 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

              {/* Top row badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest px-3 py-1 rounded-full bg-[#080f0e]/80 backdrop-blur-sm border border-[#17403b] text-[#30c4b6]">
                  {item.tag}
                </span>
                <span className="w-8 h-8 rounded-full bg-[#080f0e]/80 backdrop-blur-sm border border-[#17403b] text-[#e8f5f3] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FaExpandAlt size={12} />
                </span>
              </div>

              {/* Bottom caption */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] text-[#30c4b6] tracking-widest">
                    {String(idx + 1).padStart(2, "0")} / {String(ACHIEVEMENTS.length).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl sm:text-2xl text-[#e8f5f3] tracking-wide leading-tight mt-0.5">
                    {item.title}
                  </h3>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeItem && activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-4xl bg-[#0b1514] border border-[#17403b] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#122e2a]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#30c4b6]">
                  {activeItem.tag} · {activeIndex + 1} / {ACHIEVEMENTS.length}
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

            <div className="relative w-full h-[55vh] sm:h-[68vh] bg-[#060d0c]">
              {/* Skeleton loader shown while image decodes */}
              {!isActiveLoaded && (
                <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center p-8">
                  <div className="w-full h-full rounded-xl bg-gradient-to-r from-[#0c1917] via-[#132c28] to-[#0c1917] animate-pulse border border-[#17403b]/60 flex items-center justify-center">
                    <span className="loading loading-spinner text-[#30c4b6] w-9" />
                  </div>
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
                onLoad={() => markLoaded(activeItem.id)}
                className={`object-contain p-2 transition-opacity duration-200 ${
                  isActiveLoaded ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* Background preload of adjacent prev/next slides at the exact same size */}
              {prevItem && prevItem.id !== activeItem.id && (
                <div className="sr-only" aria-hidden="true">
                  <Image
                    src={prevItem.src}
                    alt=""
                    fill
                    priority
                    quality={80}
                    sizes="(max-width: 896px) 95vw, 896px"
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
