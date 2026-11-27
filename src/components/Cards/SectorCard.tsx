"use client";

import { useEffect, useRef } from "react";

interface SectorCardProps {
  number: string;
  icon: string;
  cardTitle: string;
  cardSubTitle: string;
}

export default function SectorCard({
  number,
  icon,
  cardTitle,
  cardSubTitle,
}: SectorCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({
    targetX: 0,
    targetY: 0,
    targetScale: 1,
    currentX: 0,
    currentY: 0,
    currentScale: 1,
    rafId: 0 as number | 0,
    active: false,
  });

  useEffect(() => {
    const s = stateRef.current;
    return () => {
      if (s.rafId) cancelAnimationFrame(s.rafId);
    };
  }, []);

  const startAnimation = () => {
    const s = stateRef.current;
    if (s.rafId) return;

    const tick = () => {
      const lerp = 0.12;
      s.currentX += (s.targetX - s.currentX) * lerp;
      s.currentY += (s.targetY - s.currentY) * lerp;
      s.currentScale += (s.targetScale - s.currentScale) * lerp;

      if (cardRef.current) {
        cardRef.current.style.transform = `perspective(900px) rotateX(${s.currentX.toFixed(
          3
        )}deg) rotateY(${s.currentY.toFixed(3)}deg) scale3d(${s.currentScale.toFixed(
          4
        )}, ${s.currentScale.toFixed(4)}, 1)`;
      }

      const settled =
        !s.active &&
        Math.abs(s.targetX - s.currentX) < 0.02 &&
        Math.abs(s.targetY - s.currentY) < 0.02 &&
        Math.abs(s.targetScale - s.currentScale) < 0.0005;

      if (settled) {
        if (cardRef.current) {
          cardRef.current.style.transform =
            "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
        }
        s.rafId = 0;
        return;
      }

      s.rafId = requestAnimationFrame(tick);
    };

    s.rafId = requestAnimationFrame(tick);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Measure the static outer wrapper so tilting never causes layout feedback wobble
    const rect = wrapper.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const s = stateRef.current;
    s.active = true;
    s.targetX = (0.5 - py) * 14;
    s.targetY = (px - 0.5) * 14;
    s.targetScale = 1.025;

    if (glowRef.current) {
      glowRef.current.style.opacity = "1";
      glowRef.current.style.background = `radial-gradient(280px circle at ${(px * 100).toFixed(
        1
      )}% ${(py * 100).toFixed(1)}%, rgba(48, 196, 182, 0.16), transparent 70%)`;
    }

    startAnimation();
  };

  const handleMouseLeave = () => {
    const s = stateRef.current;
    s.active = false;
    s.targetX = 0;
    s.targetY = 0;
    s.targetScale = 1;

    if (glowRef.current) {
      glowRef.current.style.opacity = "0";
    }

    startAnimation();
  };

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="h-full"
    >
      <div
        ref={cardRef}
        className="relative h-full overflow-hidden rounded-2xl card bg-[#0c1917] border border-[#0f2d29] hover:border-[#30c4b6]/60 hover:shadow-2xl hover:shadow-[#30c4b6]/10 text-white transition-[border-color,box-shadow] duration-300"
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      >
        <div
          ref={glowRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
        />
        <div className="card-body relative z-10 flex flex-col justify-between p-6 min-h-[215px]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-mono text-[#30c4b6] tracking-widest">{number}</span>
              <span className="text-2xl leading-none">{icon}</span>
            </div>
            <h3 className="text-[#e8f5f3] text-2xl tracking-wide leading-snug">{cardTitle}</h3>
          </div>
          <p className="text-xs leading-relaxed mt-3">{cardSubTitle}</p>
        </div>
      </div>
    </div>
  );
}
