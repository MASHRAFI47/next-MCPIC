"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, isValid } from "date-fns";
import toast from "react-hot-toast";
import {
  IconBell,
  IconBook,
  IconCalendar,
  IconCheckDouble,
  IconForm,
  IconMail,
  IconMegaphone,
  IconRecruit,
  IconShield,
  IconTicket,
  IconUsers,
} from "@/components/Icons";
import { apiFetch } from "@/lib/api-client";
import type {
  NotificationCategory,
  NotificationRecord,
  NotificationsResponse,
} from "@/types/models";

interface NotificationBellProps {
  /** "right" aligns the panel's right edge with the button (best for top-right Header);
   *  "left" aligns the panel's left edge with the button (best for left Dashboard sidebar). */
  align?: "right" | "left";
}

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (!isValid(date)) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}

function getCategoryVisual(category: NotificationCategory) {
  switch (category) {
    case "event":
      return { icon: IconCalendar, badgeClass: "bg-teal-500/15 text-[#30c4b6]" };
    case "post":
      return { icon: IconBook, badgeClass: "bg-cyan-500/15 text-cyan-400" };
    case "recruitment":
      return { icon: IconRecruit, badgeClass: "bg-amber-500/15 text-amber-400" };
    case "message":
      return { icon: IconMail, badgeClass: "bg-rose-500/15 text-rose-400" };
    case "application":
      return { icon: IconForm, badgeClass: "bg-purple-500/15 text-purple-400" };
    case "registration":
      return { icon: IconTicket, badgeClass: "bg-emerald-500/15 text-emerald-400" };
    case "member":
      return { icon: IconUsers, badgeClass: "bg-sky-500/15 text-sky-400" };
    case "security":
      return { icon: IconShield, badgeClass: "bg-red-500/15 text-red-400" };
    case "announcement":
    default:
      return { icon: IconMegaphone, badgeClass: "bg-teal-500/15 text-[#30c4b6]" };
  }
}

export default function NotificationBell({ align = "right" }: NotificationBellProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === "admin";

  const [open, setOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("/");
  const [audience, setAudience] = useState<"members" | "all">("members");

  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => apiFetch<NotificationsResponse>("/api/notifications"),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

  const markReadMutation = useMutation({
    mutationFn: (payload: { id: string } | { all: true }) =>
      apiFetch("/api/notifications/read", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onMutate: async (payload) => {
      const key = ["notifications", user?.id];
      const prev = queryClient.getQueryData<NotificationsResponse>(key);
      if (prev) {
        if ("all" in payload) {
          queryClient.setQueryData<NotificationsResponse>(key, {
            notifications: prev.notifications.map((n) => ({ ...n, is_read: true })),
            unreadCount: 0,
          });
        } else {
          const target = prev.notifications.find((n) => n.id === payload.id);
          queryClient.setQueryData<NotificationsResponse>(key, {
            notifications: prev.notifications.map((n) =>
              n.id === payload.id ? { ...n, is_read: true } : n
            ),
            unreadCount:
              target && !target.is_read
                ? Math.max(0, prev.unreadCount - 1)
                : prev.unreadCount,
          });
        }
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["notifications", user?.id], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const announceMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/notifications", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          link: link.trim() || "/",
          audience,
        }),
      }),
    onSuccess: () => {
      toast.success("Announcement sent!");
      setTitle("");
      setBody("");
      setLink("/");
      setComposeOpen(false);
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to send announcement");
    },
  });

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setComposeOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setComposeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleSelectNotification = (item: NotificationRecord) => {
    if (!item.is_read) {
      markReadMutation.mutate({ id: item.id });
    }
    setOpen(false);
    const safeLink =
      item.link && item.link.startsWith("/") && !item.link.startsWith("//")
        ? item.link
        : "/";
    router.push(safeLink);
  };

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    announceMutation.mutate();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (next) void refetch();
            return next;
          });
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
        title={isAdmin ? "Admin Notifications" : "Notifications"}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#122e2a] bg-[#0b1514] text-[#e8f5f3] hover:border-[#30c4b6] hover:text-[#30c4b6] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30c4b6]/60"
      >
        <IconBell size={17} />
        {unreadCount > 0 && (
          <span className="keep-dark absolute -top-1.5 -right-1.5 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-mono font-bold leading-none text-white shadow-sm ring-2 ring-[#080f0e]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`animate-modal-in absolute z-[1200] mt-2.5 w-80 sm:w-96 rounded-2xl border border-[#122e2a] bg-[#0b1514] shadow-2xl overflow-hidden ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#122e2a]">
            <div>
              <h3 className="text-lg tracking-wider text-[#e8f5f3] leading-none">
                {isAdmin ? "ADMIN NOTIFICATIONS" : "NOTIFICATIONS"}
              </h3>
              <span className="text-[11px] font-mono text-[#89aca8]">
                {unreadCount > 0
                  ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                  : "All caught up"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setComposeOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#17403b] bg-[#102220] px-2 py-1 text-[11px] font-mono text-[#30c4b6] hover:border-[#30c4b6] transition-colors"
                >
                  <IconMegaphone size={12} />
                  {composeOpen ? "Close" : "Announce"}
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markReadMutation.mutate({ all: true })}
                  disabled={markReadMutation.isPending}
                  title="Mark all as read"
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-mono text-[#89aca8] hover:text-[#30c4b6] hover:bg-[#102220] transition-colors"
                >
                  <IconCheckDouble size={13} />
                  Read all
                </button>
              )}
            </div>
          </div>

          {/* Admin Quick Broadcast Composer */}
          {isAdmin && composeOpen && (
            <form
              onSubmit={handleSendAnnouncement}
              className="p-3.5 border-b border-[#122e2a] bg-[#0d1c1a] space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#30c4b6]">
                  Send Club Announcement
                </span>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as "members" | "all")}
                  aria-label="Announcement audience"
                  className="select select-xs bg-[#0b1514] border-[#17403b] text-[#e8f5f3] text-[11px]"
                >
                  <option value="members">To Members</option>
                  <option value="all">To Everyone</option>
                </select>
              </div>
              <input
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title..."
                className="input input-sm input-bordered w-full bg-[#0b1514] text-xs text-[#e8f5f3] placeholder:text-[#4a6564]"
              />
              <textarea
                required
                minLength={5}
                maxLength={300}
                rows={2}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a short update for members..."
                className="textarea textarea-sm textarea-bordered w-full bg-[#0b1514] text-xs text-[#e8f5f3] placeholder:text-[#4a6564]"
              />
              <div className="flex items-center gap-2">
                <select
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  aria-label="Destination page when clicked"
                  className="select select-xs flex-1 bg-[#0b1514] border-[#17403b] text-xs text-[#e8f5f3]"
                >
                  <option value="/">Opens: Home Page</option>
                  <option value="/events">Opens: Events Page</option>
                  <option value="/posts">Opens: Posts Page</option>
                  <option value="/executives">Opens: Executives Page</option>
                  <option value="/apply-for-executive">Opens: Executive Application</option>
                  <option value="/contact">Opens: Contact Page</option>
                  <option value="/dashboard">Opens: Dashboard</option>
                </select>
                <button
                  type="submit"
                  disabled={announceMutation.isPending}
                  className="btn btn-xs border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
                >
                  {announceMutation.isPending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          )}

          {/* Notification Feed */}
          <div className="max-h-96 overflow-y-auto divide-y divide-[#122e2a]">
            {isLoading ? (
              <div className="p-4 space-y-3 animate-pulse">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#102220] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-3/4 rounded bg-[#132c28]" />
                      <div className="h-3 w-full rounded bg-[#0f2422]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#102220] text-[#30c4b6]">
                  <IconBell size={20} />
                </div>
                <p className="text-sm font-semibold text-[#e8f5f3]">No notifications yet</p>
                <p className="text-xs text-[#89aca8]">
                  {isAdmin
                    ? "New contact messages, applications, and registrations will appear here."
                    : "New events, tech posts, and recruitment openings will appear here."}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const { icon: CatIcon, badgeClass } = getCategoryVisual(item.category);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectNotification(item)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-[#102220] ${
                      item.is_read ? "opacity-75" : "bg-[#0d1c1a]/70"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${badgeClass}`}
                    >
                      <CatIcon size={15} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-[#e8f5f3] leading-snug line-clamp-1">
                          {item.title}
                        </span>
                        {!item.is_read && (
                          <span
                            aria-label="Unread"
                            className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#30c4b6]"
                          />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[#89aca8] line-clamp-2 leading-relaxed">
                        {item.body}
                      </p>
                      <span className="mt-1 block text-[10px] font-mono text-[#4a6564]">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
