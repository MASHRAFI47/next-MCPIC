"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { IconDownload } from "@/components/Icons";
import { TablePageSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";
import type { SegmentRegistrationRecord } from "@/types/models";

interface RegistrationsResponse {
  segment: {
    id: string;
    name: string;
    event_id: string;
    event_name: string;
    registration_open: boolean;
    max_participants: number | null;
    is_team_based: boolean;
  };
  registrations: SegmentRegistrationRecord[];
}

function fmtDate(val: string): string {
  const d = new Date(val);
  return isValid(d) ? format(d, "MMM d, yyyy · h:mm a") : "—";
}

export default function SegmentRegistrationsAdminPage() {
  const params = useParams<{ segmentId: string }>();
  const segmentId = params?.segmentId ?? "";
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["segment-registrations", segmentId],
    enabled: Boolean(segmentId),
    queryFn: () =>
      apiFetch<RegistrationsResponse>(
        `/api/segments/${encodeURIComponent(segmentId)}/registrations`
      ),
  });

  const deleteReg = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/registrations/${id}`, { method: "DELETE" }),
    onSuccess: () => refetch(),
  });

  const filtered = useMemo(() => {
    const list = data?.registrations ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.participant_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.ticket_code.toLowerCase().includes(q) ||
        r.institution.toLowerCase().includes(q) ||
        (r.team_name ?? "").toLowerCase().includes(q)
    );
  }, [data?.registrations, search]);

  const handleDelete = async (reg: SegmentRegistrationRecord) => {
    const confirm = await Swal.fire({
      title: `Remove registration ${reg.ticket_code}?`,
      text: `${reg.participant_name} (${reg.email})`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
    });
    if (!confirm.isConfirmed) return;

    try {
      await deleteReg.mutateAsync(reg.id);
      toast.success("Registration removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  if (isLoading) return <TablePageSkeleton rows={6} cols={6} />;
  if (!data) return <p className="text-red-400">Segment not found.</p>;

  const { segment, registrations } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/all-event-segments/${segment.event_id}`}
            className="text-xs font-mono uppercase tracking-widest text-[#30c4b6]"
          >
            ← Back to {segment.event_name}
          </Link>
          <h1 className="text-4xl text-[#e8f5f3] mt-1">{segment.name} — Registrations</h1>
          <p className="text-sm">
            {registrations.length} registered
            {segment.max_participants ? ` / ${segment.max_participants} max capacity` : ""}
          </p>
        </div>

        <a
          href={`/api/segments/${encodeURIComponent(segmentId)}/registrations/export`}
          className="btn btn-sm border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92] gap-2"
        >
          <IconDownload size={16} />
          Export CSV
        </a>
      </div>

      <div className="max-w-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by ticket, name, email, school..."
          className="input input-sm input-bordered w-full bg-[#0b1514] border-[#17403b] text-[#e8f5f3]"
        />
      </div>

      <div className="overflow-x-auto bg-[#0b1514] border border-[#122e2a] rounded-xl">
        <table className="table table-sm">
          <thead>
            <tr className="text-[#30c4b6]">
              <th>Ticket</th>
              <th>Participant</th>
              <th>Phone</th>
              <th>Institution &amp; Class</th>
              {segment.is_team_based && <th>Team</th>}
              <th>Registered At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={segment.is_team_based ? 7 : 6} className="text-center py-8 text-[#89aca8]">
                  No registrations found.
                </td>
              </tr>
            ) : (
              filtered.map((reg) => (
                <tr key={reg.id} className="border-[#122e2a]">
                  <td className="font-mono text-xs text-[#30c4b6] font-semibold">
                    {reg.ticket_code}
                  </td>
                  <td>
                    <div className="font-semibold text-[#e8f5f3]">{reg.participant_name}</div>
                    <div className="text-xs text-[#89aca8]">{reg.email}</div>
                  </td>
                  <td className="text-xs font-mono">{reg.phone}</td>
                  <td>
                    <div className="text-xs text-[#e8f5f3]">{reg.institution}</div>
                    <div className="text-[11px] text-[#89aca8]">{reg.class_grade}</div>
                  </td>
                  {segment.is_team_based && (
                    <td>
                      <div className="text-xs font-semibold text-[#e8f5f3]">
                        {reg.team_name || "—"}
                      </div>
                      {reg.team_members && (
                        <div className="text-[11px] text-[#89aca8]">{reg.team_members}</div>
                      )}
                    </td>
                  )}
                  <td className="text-xs whitespace-nowrap">{fmtDate(reg.created_at)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleDelete(reg)}
                      className="btn btn-xs btn-error text-white"
                    >
                      Remove
                    </button>
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
