"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import { TablePageSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";
import type { AuditLogRecord } from "@/types/models";

const ACTION_FILTERS = [
  { label: "All", value: "" },
  { label: "Auth", value: "auth." },
  { label: "MFA", value: "mfa." },
  { label: "Users", value: "user." },
  { label: "Events", value: "event." },
  { label: "Segments", value: "segment." },
  { label: "Registrations", value: "registration." },
  { label: "Blogs", value: "blog." },
  { label: "Executives", value: "executive" },
];

function fmtDate(val: string): string {
  const d = new Date(val);
  return isValid(d) ? format(d, "MMM d, yyyy · HH:mm:ss") : "—";
}

export default function AuditLogsPage() {
  const [actionFilter, setActionFilter] = useState("");

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", actionFilter],
    queryFn: () =>
      apiFetch<AuditLogRecord[]>(
        actionFilter
          ? `/api/admin/audit-logs?action=${encodeURIComponent(actionFilter)}&limit=150`
          : "/api/admin/audit-logs?limit=150"
      ),
  });

  if (isLoading) return <TablePageSkeleton rows={8} cols={5} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl text-[#e8f5f3]">Security &amp; Activity Audit Logs</h1>
          <p className="text-sm">
            Append-only PostgreSQL audit trail of authentication, MFA, admin, and registration events.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="btn btn-sm bg-[#0b1514] border-[#17403b] text-[#30c4b6]"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ACTION_FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setActionFilter(f.value)}
            className={`btn btn-xs font-mono ${
              actionFilter === f.value
                ? "border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
                : "bg-[#0b1514] border-[#122e2a] text-[#89aca8]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto bg-[#0b1514] border border-[#122e2a] rounded-xl">
        <table className="table table-sm">
          <thead>
            <tr className="text-[#30c4b6]">
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Metadata</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-[#89aca8]">
                  No audit events match this filter.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-[#122e2a]">
                  <td className="font-mono text-xs whitespace-nowrap">{fmtDate(log.created_at)}</td>
                  <td>
                    {log.actor_email ? (
                      <div>
                        <div className="text-xs font-semibold text-[#e8f5f3]">{log.actor_name}</div>
                        <div className="text-[11px] text-[#89aca8]">{log.actor_email}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-[#89aca8] font-mono">system / public</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-sm bg-[#102220] border-[#17403b] text-[#30c4b6] font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-[#c5dbd8]">{log.resource_type}</td>
                  <td className="max-w-xs">
                    <code className="text-[11px] text-[#89aca8] break-all">
                      {Object.keys(log.metadata || {}).length > 0
                        ? JSON.stringify(log.metadata)
                        : "—"}
                    </code>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
