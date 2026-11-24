"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { GiHamburgerMenu } from "react-icons/gi";
import { FaHome, FaUsers, FaWpforms, FaSignOutAlt } from "react-icons/fa";
import { FaUsersRays } from "react-icons/fa6";
import { GoGraph } from "react-icons/go";
import { MdAddAlert, MdAddBox, MdOutlineEvent } from "react-icons/md";
import { GrBlog } from "react-icons/gr";
import { ImBlog } from "react-icons/im";
import { CgProfile } from "react-icons/cg";
import LoadingSpinner from "@/components/LoadingSpinner";

const ADMIN_LINKS = [
  { href: "/dashboard", label: "Statistics", icon: GoGraph, exact: true },
  { href: "/dashboard/manage-users", label: "Manage Users", icon: FaUsers },
  { href: "/dashboard/add-event", label: "Add Event", icon: MdAddAlert },
  { href: "/dashboard/all-events", label: "All Events", icon: MdOutlineEvent },
  { href: "/dashboard/add-event-segment", label: "Add Event Segment", icon: MdAddBox },
  { href: "/dashboard/add-blog", label: "Add Blog", icon: ImBlog },
  { href: "/dashboard/all-blogs", label: "All Blogs", icon: GrBlog },
  { href: "/dashboard/recruit", label: "Recruit", icon: FaUsersRays },
];

const MEMBER_LINKS = [
  { href: "/dashboard", label: "Statistics", icon: GoGraph, exact: true },
  { href: "/dashboard/my-forms", label: "My Forms", icon: FaWpforms },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  const user = session?.user;
  const roleLinks = user?.role === "admin" ? ADMIN_LINKS : MEMBER_LINKS;

  const renderMenu = (onNavigate?: () => void) => (
    <ul className="menu space-y-1 p-3">
      {roleLinks.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={`font-semibold flex items-center gap-3 rounded-lg ${
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

      <div className="divider my-2 border-[#122e2a]" />

      <li>
        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          className={`font-semibold flex items-center gap-3 rounded-lg ${
            pathname.startsWith("/dashboard/profile")
              ? "bg-[#30c4b6] text-[#080f0e]"
              : "text-[#e8f5f3] hover:bg-[#102220]"
          }`}
        >
          <CgProfile size={18} />
          <span>Profile &amp; MFA</span>
        </Link>
      </li>
      <li>
        <Link
          href="/"
          onClick={onNavigate}
          className="font-semibold flex items-center gap-3 text-[#89aca8] hover:text-[#e8f5f3] hover:bg-[#102220] rounded-lg"
        >
          <FaHome size={18} />
          <span>Home</span>
        </Link>
      </li>
      <li>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="font-semibold flex items-center gap-3 text-red-400 hover:bg-red-950/40 rounded-lg"
        >
          <FaSignOutAlt size={18} />
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
          <GiHamburgerMenu size={20} />
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
