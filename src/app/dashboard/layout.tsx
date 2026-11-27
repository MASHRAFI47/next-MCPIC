"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  IconActivity,
  IconAward,
  IconBook,
  IconCalendar,
  IconCalendarPlus,
  IconFilePlus,
  IconForm,
  IconHome,
  IconLayers,
  IconLogout,
  IconMail,
  IconMenu,
  IconRecruit,
  IconStats,
  IconTicket,
  IconTrophy,
  IconUser,
  IconUsers,
} from "@/components/Icons";

interface NavItem {
  href: string;
  label: string;
  icon: typeof IconStats;
  exact?: boolean;
  matchPrefixes?: string[];
}

const ADMIN_LINKS: NavItem[] = [
  { href: "/dashboard", label: "Statistics", icon: IconStats, exact: true },
  { href: "/dashboard/manage-users", label: "Manage Users", icon: IconUsers },
  { href: "/dashboard/add-event", label: "Add Event", icon: IconCalendarPlus },
  {
    href: "/dashboard/all-events",
    label: "All Events",
    icon: IconCalendar,
    matchPrefixes: [
      "/dashboard/all-event-segments",
      "/dashboard/update-event-segment",
      "/dashboard/segment-registrations",
    ],
  },
  { href: "/dashboard/add-event-segment", label: "Add Event Segment", icon: IconLayers },
  { href: "/dashboard/add-blog", label: "Add Blog", icon: IconFilePlus },
  {
    href: "/dashboard/all-blogs",
    label: "All Blogs",
    icon: IconBook,
    matchPrefixes: ["/dashboard/update-blog"],
  },
  { href: "/dashboard/recruit", label: "Recruit", icon: IconRecruit },
  { href: "/dashboard/manage-executives", label: "Executives", icon: IconAward },
  { href: "/dashboard/manage-achievements", label: "Achievements", icon: IconTrophy },
  { href: "/dashboard/messages", label: "Messages Inbox", icon: IconMail },
  { href: "/dashboard/audit-logs", label: "Audit Logs", icon: IconActivity },
];

const MEMBER_LINKS: NavItem[] = [
  { href: "/dashboard", label: "Statistics", icon: IconStats, exact: true },
  { href: "/dashboard/my-registrations", label: "My Registrations", icon: IconTicket },
  { href: "/dashboard/my-forms", label: "My Forms", icon: IconForm },
];

function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return true;
  }
  if (item.matchPrefixes) {
    return item.matchPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  }
  return false;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const user = session?.user;
  const roleLinks = user?.role === "admin" ? ADMIN_LINKS : MEMBER_LINKS;

  const isProfileActive =
    pathname === "/dashboard/profile" || pathname.startsWith("/dashboard/profile/");

  const renderMenu = (onNavigate?: () => void) => (
    <ul className="space-y-1 p-3">
      {roleLinks.map((item) => {
        const Icon = item.icon;
        const isActive = isNavItemActive(pathname, item);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`w-full px-3 py-2.5 text-sm font-semibold flex items-center gap-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30c4b6]/60 ${
                isActive
                  ? "bg-[#30c4b6] text-[#080f0e]"
                  : "text-[#e8f5f3] hover:bg-[#102220]"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          </li>
        );
      })}

      <li aria-hidden="true" className="py-2">
        <div className="border-t border-[#122e2a]" />
      </li>

      <li>
        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          aria-current={isProfileActive ? "page" : undefined}
          className={`w-full px-3 py-2.5 text-sm font-semibold flex items-center gap-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30c4b6]/60 ${
            isProfileActive
              ? "bg-[#30c4b6] text-[#080f0e]"
              : "text-[#e8f5f3] hover:bg-[#102220]"
          }`}
        >
          <IconUser size={18} />
          <span>Profile &amp; MFA</span>
        </Link>
      </li>
      <li>
        <Link
          href="/"
          onClick={onNavigate}
          className="w-full px-3 py-2.5 text-sm font-semibold flex items-center gap-3 text-[#89aca8] hover:text-[#e8f5f3] hover:bg-[#102220] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30c4b6]/60"
        >
          <IconHome size={18} />
          <span>Home</span>
        </Link>
      </li>
      <li>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full px-3 py-2.5 text-sm font-semibold flex items-center gap-3 text-red-400 hover:bg-red-950/40 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
        >
          <IconLogout size={18} />
          <span>Logout</span>
        </button>
      </li>
    </ul>
  );

  return (
    <div className="min-h-screen bg-[#080f0e] text-[#e8f5f3] flex flex-col lg:flex-row">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0b1514] border-b border-[#122e2a]">
        <button
          type="button"
          aria-label="Open dashboard navigation"
          onClick={() => setDrawerOpen(true)}
          className="btn btn-ghost btn-sm text-[#e8f5f3]"
        >
          <IconMenu size={20} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#89aca8]">Hi, {user?.name}</span>
          <Image
            src={user?.image || "/images/blank.webp"}
            alt={user?.name || "Avatar"}
            width={36}
            height={36}
            unoptimized={(user?.image || "").startsWith("/api/uploads/")}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-[#30c4b6]/50"
          />
        </div>
      </div>

      {/* Mobile slide-over drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 bg-[#0b1514] border-r border-[#122e2a] h-full overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#122e2a]">
              <div className="flex items-center gap-2">
                <Image
                  src="/mcpic-logo.png"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                  alt="MCPIC"
                />
                <span className="font-heading text-2xl tracking-wider text-white">MCPIC</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="btn btn-ghost btn-xs"
              >
                ✕
              </button>
            </div>
            {renderMenu(() => setDrawerOpen(false))}
          </div>
          <div
            className="flex-1 bg-black/60"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-[#0b1514] border-r border-[#122e2a] min-h-screen">
        <div className="flex items-center gap-3 p-5 border-b border-[#122e2a]">
          <Image
            src="/mcpic-logo.png"
            width={48}
            height={48}
            className="w-12 h-12 object-contain"
            alt="MCPIC Logo"
          />
          <div>
            <h1 className="text-3xl leading-none tracking-wider text-white">MCPIC</h1>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#30c4b6]">
              {user?.role === "admin" ? "Admin Console" : "Member Portal"}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{renderMenu()}</div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-5 md:p-8 overflow-x-hidden">{children}</main>
    </div>
  );
}
