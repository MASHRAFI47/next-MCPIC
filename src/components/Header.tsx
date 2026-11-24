"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
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
  const { data: session, status } = useSession();
  const user = session?.user;

  const { data: recruitment } = useQuery({
    queryKey: ["recruitment-status"],
    queryFn: () => apiFetch<{ enabled: boolean }>("/api/settings/recruitment"),
    staleTime: 30_000,
  });

  const recruitmentOpen = Boolean(recruitment?.enabled);

  const handleApplyForExecutive = () => {
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

  const renderLinks = (isMobile = false) => (
    <>
      {NAV_LINKS.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={
                isActive
                  ? "!bg-[#0c1d1b] text-[#e8f5f3] font-semibold"
                  : "text-[#8aada9] hover:text-[#e8f5f3]"
              }
            >
              {item.label}
            </Link>
          </li>
        );
      })}
      {isMobile && user && recruitmentOpen && (
        <li className="mt-2">
          <button
            type="button"
            onClick={handleApplyForExecutive}
            className="text-sm font-semibold py-2 rounded-2xl px-4 border border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
          >
            Apply For Executives
          </button>
        </li>
      )}
    </>
  );

  return (
    <header className="bg-[#07100e] border-b-2 border-[#0f2422] sticky top-0 z-50">
      <div className="navbar container mx-auto">
        <div className="navbar-start">
          <div className="dropdown z-[1000]">
            <div tabIndex={0} role="button" aria-label="Open navigation menu" className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[#e8f5f3]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="bg-[#0b1514] border border-[#122e2a] menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow rounded-box w-56"
            >
              {renderLinks(true)}
            </ul>
          </div>
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/mcpic-logo.png"
              width={56}
              height={56}
              priority
              className="w-14 h-14 object-contain"
              alt="MCPIC Logo"
            />
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-2">{renderLinks(false)}</ul>
        </div>

        <div className="navbar-end gap-3">
          {status === "loading" ? (
            <span className="loading loading-spinner loading-sm text-[#30c4b6]" />
          ) : user ? (
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
              <div className="dropdown dropdown-end z-[1000]">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
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
    </header>
  );
}
