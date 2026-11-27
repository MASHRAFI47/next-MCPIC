"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type RevealDirection = "up" | "down" | "left" | "right" | "zoom" | "none";

interface RevealProps {
  children: ReactNode;
  direction?: RevealDirection;
  /** Delay in milliseconds before starting the transition */
  delay?: number;
  /** Transition duration in milliseconds */
  duration?: number;
  /** Extra CSS classes for the wrapper */
  className?: string;
  /** Animate immediately on mount (best for above-the-fold hero elements) */
  immediate?: boolean;
}

const HIDDEN_TRANSFORMS: Record<RevealDirection, string> = {
  up: "translate-y-7",
  down: "-translate-y-7",
  left: "translate-x-7",
  right: "-translate-x-7",
  zoom: "scale-95 translate-y-3",
  none: "",
};

/**
 * Lightweight, zero-dependency scroll-reveal wrapper powered by the browser's
 * native IntersectionObserver + GPU-composited CSS transforms.
 */
export default function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 600,
  className = "",
  immediate = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Respect OS-level "Reduce Motion" accessibility preference
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }

    if (immediate) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -32px 0px",
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate]);

  const hiddenClass = `opacity-0 ${HIDDEN_TRANSFORMS[direction]}`;
  const visibleClass = "opacity-100 translate-x-0 translate-y-0 scale-100";

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      className={`transition-all will-change-transform ${
        visible ? visibleClass : hiddenClass
      } ${className}`}
    >
      {children}
    </div>
  );
}
