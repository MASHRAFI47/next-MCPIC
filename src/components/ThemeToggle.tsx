"use client";

import { useTheme } from "@/components/Providers";
import { IconMoon, IconSun } from "@/components/Icons";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[#122e2a] bg-[#0b1514] text-[#e8f5f3] hover:border-[#30c4b6] hover:text-[#30c4b6] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30c4b6]/60 ${
        showLabel ? "px-3 py-2 text-xs font-semibold" : "h-9 w-9"
      } ${className}`}
    >
      {isDark ? (
        <IconSun size={17} className="text-amber-400 shrink-0" />
      ) : (
        <IconMoon size={16} className="text-[#0d9488] shrink-0" />
      )}
      {showLabel && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
    </button>
  );
}
