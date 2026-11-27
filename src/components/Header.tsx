"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import ThemeToggle from "@/components/ThemeToggle";
import { apiFetch } from "@/lib/api-client";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/posts", label: "Posts" },
  { href: "/executives", label: "Executives" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;

  const { data: recruitment } = useQuery({
    queryKey: ["recruitment-status"],
    enabled: Boolean(user),
    queryFn: () => apiFetch<{ enabled: boolean }>("/api/settings/recruitment"),
    staleTime: 60_000,
  });

  const recruitmentOpen = Boolean(recruitment?.enabled);

  const handleApplyForExecutive = () => {
    setMobileOpen(false);
    if (!user) {
      router.push("/login?callbackUrl=/apply-for-executive");
      return;
    }
    if (!user.emailVerified) {
      toast.error("Please verify your email from your dashboard profile first.");
      return;
    }
    router.push("/apply-for-executive");
  };

  return (
    <header className="bg-[#07100e]/95 backdrop-blur-md border-b border-[#0f2422] sticky top-0 z-50">
      <div className="navbar container mx-auto px-4">
        <div className="navbar-start gap-2">
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="btn btn-ghost btn-sm lg:hidden text-[#e8f5f3]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10m-10 6h16" />
              )}
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <Image
              src="/mcpic-logo.png"
              width={52}
              height={52}
              priority
              className="w-12 h-12 object-contain"
              alt="MCPIC Logo"
            />
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="flex items-center px-1 gap-1.5">
            {NAV_LINKS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : item.href === "/events"
                    ? pathname === "/events" ||
                      pathname.startsWith("/events/") ||
                      pathname.startsWith("/segments/")
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex items-center px-4 py-2 text-sm rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30c4b6]/60 ${
                      isActive
                        ? "bg-[#0c1d1b] text-[#30c4b6] font-semibold"
                        : "text-[#8aada9] hover:text-[#e8f5f3] hover:bg-[#0c1d1b]/60"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="navbar-end gap-2.5">
          <ThemeToggle />
          {user ? (
            <>
              {recruitmentOpen && (
                <button
                  type="button"
                  onClick={handleApplyForExecutive}
                  className="hidden md:inline-block text-sm font-semibold py-2 rounded-2xl px-5 border border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92] transition-colors"
                >
                  Apply For Executives
                </button>
              )}
              <div
                className="dropdown dropdown-end z-[1000]"
                onMouseEnter={() => {
                  router.prefetch("/dashboard");
                  router.prefetch("/dashboard/profile");
                }}
              >
                <div
                  tabIndex={0}
                  role="button"
                  onClick={() => {
                    router.prefetch("/dashboard");
                    router.prefetch("/dashboard/profile");
                  }}
                  className="btn btn-ghost btn-circle avatar"
                >
                  <div className="w-10 h-10 rounded-full ring-1 ring-[#30c4b6]/50 relative overflow-hidden">
                    <Image
                      alt={user.name || "User avatar"}
                      src={user.image || "/images/blank.webp"}
                      fill
                      sizes="40px"
                      unoptimized={(user.image || "").startsWith("/api/uploads/")}
                      className="object-cover"
                    />
                  </div>
                </div>
                <ul
                  tabIndex={0}
                  className="mt-3 z-[100] p-2 shadow menu menu-sm dropdown-content bg-[#0b1514] border border-[#122e2a] rounded-box w-56"
                >
                  <li className="px-3 py-2 border-b border-[#122e2a] mb-1 pointer-events-none">
                    <span className="font-semibold text-[#e8f5f3] block truncate">{user.name}</span>
                    <span className="text-xs text-[#30c4b6] uppercase">{user.role}</span>
                  </li>
                  <li>
                    <Link href="/dashboard">Dashboard</Link>
                  </li>
                  <li>
                    <Link href="/dashboard/profile">Profile &amp; MFA</Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="text-red-400 hover:text-red-300"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-semibold py-2 rounded-2xl px-5 border border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92] transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Controlled Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav className="lg:hidden bg-[#0b1514] border-t border-[#122e2a] px-4 py-3">
          <ul className="flex flex-col space-y-1">
            {NAV_LINKS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : item.href === "/events"
                    ? pathname === "/events" ||
                      pathname.startsWith("/events/") ||
                      pathname.startsWith("/segments/")
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`block w-full px-3 py-2 text-sm rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30c4b6]/60 ${
                      isActive
                        ? "bg-[#0c1d1b] text-[#30c4b6] font-semibold"
                        : "text-[#8aada9] hover:text-[#e8f5f3] hover:bg-[#0c1d1b]/60"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            {user && recruitmentOpen && (
              <li className="pt-2">
                <button
                  type="button"
                  onClick={handleApplyForExecutive}
                  className="text-sm font-semibold py-2 rounded-2xl px-4 border border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
                >
                  Apply For Executives
                </button>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
