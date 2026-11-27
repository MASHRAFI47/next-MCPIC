import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withDbContext } from "@/lib/db";
import StatisticsCard from "@/components/Cards/StatisticsCard";
import {
  IconBook,
  IconCalendar,
  IconCheckCircle,
  IconForm,
  IconMail,
  IconShield,
  IconTicket,
  IconUsers,
} from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function DashboardStatisticsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  if (user.role === "admin") {
    const stats = await withDbContext(
      { userId: user.id, role: "admin" },
      async (client) => {
        const res = await client.query<{
          users_count: number;
          events_count: number;
          blogs_count: number;
          recruit_form_count: number;
          unread_messages_count: number;
          registrations_count: number;
        }>(`
          SELECT
            (SELECT COUNT(*)::int FROM users) AS users_count,
            (SELECT COUNT(*)::int FROM events) AS events_count,
            (SELECT COUNT(*)::int FROM blogs) AS blogs_count,
            (SELECT COUNT(*)::int FROM executive_applications) AS recruit_form_count,
            (SELECT COUNT(*)::int FROM contact_messages WHERE status = 'unread') AS unread_messages_count,
            (SELECT COUNT(*)::int FROM segment_registrations WHERE status = 'confirmed') AS registrations_count
        `);
        const row = res.rows[0];
        return {
          usersCount: row?.users_count ?? 0,
          eventsCount: row?.events_count ?? 0,
          blogsCount: row?.blogs_count ?? 0,
          recruitFormCount: row?.recruit_form_count ?? 0,
          unreadMessagesCount: row?.unread_messages_count ?? 0,
          registrationsCount: row?.registrations_count ?? 0,
        };
      }
    );

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl text-[#e8f5f3]">Admin Overview</h1>
          <p className="text-sm mt-1">Real-time MCPIC platform metrics from PostgreSQL.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatisticsCard
            icon={<IconUsers size={24} />}
            title="Total Users"
            amount={stats.usersCount}
            bgColor="bg-emerald-600"
          />
          <StatisticsCard
            icon={<IconCalendar size={24} />}
            title="Events Posted"
            amount={stats.eventsCount}
            bgColor="bg-amber-600"
          />
          <StatisticsCard
            icon={<IconTicket size={24} />}
            title="Event Registrations"
            amount={stats.registrationsCount}
            bgColor="bg-teal-600"
          />
          <StatisticsCard
            icon={<IconBook size={24} />}
            title="Blogs Published"
            amount={stats.blogsCount}
            bgColor="bg-cyan-600"
          />
          <StatisticsCard
            icon={<IconForm size={24} />}
            title="Recruit Pending"
            amount={stats.recruitFormCount}
            bgColor="bg-pink-600"
          />
          <StatisticsCard
            icon={<IconMail size={24} />}
            title="Unread Messages"
            amount={stats.unreadMessagesCount}
            bgColor="bg-indigo-600"
          />
        </div>

        {!user.mfaEnabled && (
          <div className="alert bg-amber-950/40 border border-amber-500/40 text-amber-200">
            <IconShield size={20} />
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
        <h1 className="text-4xl text-[#e8f5f3]">Welcome, {user.name}</h1>
        <p className="text-sm mt-1">
          Role: <span className="text-[#30c4b6] uppercase font-mono">{user.role}</span> ·
          Designation: <span className="text-[#e8f5f3]">{user.designation}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-[#0b1514] border border-[#122e2a] p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#30c4b6]">
            <IconCheckCircle size={20} />
            <h2 className="text-2xl text-[#e8f5f3]">Email Status</h2>
          </div>
          <p className="text-sm">
            {user.emailVerified
              ? "Your email address is verified."
              : "Your email is not verified yet. Verify it from Profile to apply for executive posts."}
          </p>
          {!user.emailVerified && (
            <Link href="/dashboard/profile" className="btn btn-sm btn-outline mt-2 w-fit">
              Verify Now
            </Link>
          )}
        </div>

        <div className="card bg-[#0b1514] border border-[#122e2a] p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#30c4b6]">
            <IconShield size={20} />
            <h2 className="text-2xl text-[#e8f5f3]">Two-Factor Authentication</h2>
          </div>
          <p className="text-sm">
            {user.mfaEnabled
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
