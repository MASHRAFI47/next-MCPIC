"use client";

import toast from "react-hot-toast";
import { FaLink } from "react-icons/fa";

export default function SharePostButton({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const handleCopy = async () => {
    const url = `${window.location.origin}/posts/${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Post link copied to clipboard!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy share link"
        className="btn btn-ghost btn-xs text-[#89aca8] hover:text-[#30c4b6] gap-1"
      >
        <FaLink size={12} />
        <span className="text-[11px] font-mono">Share</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="btn btn-sm bg-[#0d1c1a] border border-[#17403b] hover:border-[#30c4b6] text-[#e8f5f3] gap-2"
    >
      <FaLink size={13} className="text-[#30c4b6]" />
      Copy Share Link
    </button>
  );
}
