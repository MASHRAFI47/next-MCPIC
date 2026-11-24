"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { FaBook, FaUsers, FaShieldAlt, FaCheckCircle } from "react-icons/fa";
import { GrBlog } from "react-icons/gr";
import { MdOutlineEvent } from "react-icons/md";
import StatisticsCard from "@/components/Cards/StatisticsCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiFetch } from "@/lib/api-client";
import type { AdminStats } from "@/types/models";

export default function DashboardStatisticsPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === "admin";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    enabled: isAdmin,
    queryFn: () => apiFetch<AdminStats>("/api/admin/stats"),
  });

  if (status === "loading" || (isAdmin && isLoading)) {
    return <LoadingSpinner />;
  }

  if (isAdmin && stats) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl text-[#e8f5f3]">Admin Overview</h1>
          <p className="text-sm mt-1">Real-time MCPIC platform metrics from PostgreSQL.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatisticsCard
            icon={FaUsers}
            title="Total Users"
            amount={stats.usersCount}
            bgColor="bg-emerald-600"
          />
          <StatisticsCard
            icon={MdOutlineEvent}
            title="Events Posted"
            amount={stats.eventsCount}
            bgColor="bg-amber-600"
          />
          <StatisticsCard
            icon={GrBlog}
            title="Blogs Published"
            amount={stats.blogsCount}
            bgColor="bg-cyan-600"
          />
          <StatisticsCard
            icon={FaBook}
            title="Recruit Pending"
            amount={stats.recruitFormCount}
            bgColor="bg-pink-600"
          />
        </div>

        {!user?.mfaEnabled && (
          <div className="alert bg-amber-950/40 border border-amber-500/40 text-amber-200">
            <FaShieldAlt />
            <span>
              Security recommendation: Enable Multi-Factor Authentication (2FA) on your admin
              account.
            </span>
            <Link href="/dashboard/profile" className="btn btn-xs btn-warning">
              Enable 2FA
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-[#e8f5f3]">Welcome, {user?.name}</h1>
        <p className="text-sm mt-1">
          Role: <span className="text-[#30c4b6] uppercase font-mono">{user?.role}</span> ·
          Designation: <span className="text-[#e8f5f3]">{user?.designation}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-[#0b1514] border border-[#122e2a] p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#30c4b6]">
            <FaCheckCircle />
            <h2 className="text-2xl text-[#e8f5f3]">Email Status</h2>
          </div>
          <p className="text-sm">
            {user?.emailVerified
              ? "Your email address is verified."
              : "Your email is not verified yet. Verify it from Profile to apply for executive posts."}
          </p>
          {!user?.emailVerified && (
            <Link href="/dashboard/profile" className="btn btn-sm btn-outline mt-2 w-fit">
              Verify Now
            </Link>
          )}
        </div>

        <div className="card bg-[#0b1514] border border-[#122e2a] p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#30c4b6]">
            <FaShieldAlt />
            <h2 className="text-2xl text-[#e8f5f3]">Two-Factor Authentication</h2>
          </div>
          <p className="text-sm">
            {user?.mfaEnabled
              ? "2FA (TOTP) is active and protecting your account."
              : "Add an extra layer of protection with an authenticator app."}
          </p>
          <Link href="/dashboard/profile" className="btn btn-sm btn-outline mt-2 w-fit">
            Manage Security
          </Link>
        </div>
      </div>
    </div>
  );
}
