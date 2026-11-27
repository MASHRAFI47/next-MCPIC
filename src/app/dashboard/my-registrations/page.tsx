"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { TablePageSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";
import type { SegmentRegistrationRecord } from "@/types/models";

function fmtDate(val: string): string {
  const d = new Date(val);
  return isValid(d) ? format(d, "MMM d, yyyy") : "—";
}

export default function MyRegistrationsPage() {
  const { data: registrations = [], isLoading, refetch } = useQuery({
    queryKey: ["my-registrations"],
    queryFn: () => apiFetch<SegmentRegistrationRecord[]>("/api/registrations/me"),
  });

  const cancelReg = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/registrations/${id}`, { method: "DELETE" }),
    onSuccess: () => refetch(),
  });

  const handleCancel = async (reg: SegmentRegistrationRecord) => {
    const confirm = await Swal.fire({
      title: `Cancel registration for ${reg.segment_name}?`,
      text: `Ticket ${reg.ticket_code} will be cancelled.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel it",
    });
    if (!confirm.isConfirmed) return;

    try {
      await cancelReg.mutateAsync(reg.id);
      toast.success("Registration cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    }
  };

  if (isLoading) return <TablePageSkeleton rows={4} cols={4} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-[#e8f5f3]">My Event Registrations</h1>
        <p className="text-sm">Your confirmed event segment tickets for check-in.</p>
      </div>

      {registrations.length === 0 ? (
        <div className="card bg-[#0b1514] border border-[#122e2a] p-10 text-center space-y-3">
          <h2 className="text-2xl text-[#e8f5f3]">No Registrations Yet</h2>
          <p className="text-sm">Browse upcoming events and register for any open segment.</p>
          <Link
            href="/events"
            className="btn btn-sm mx-auto border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
          >
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {registrations.map((reg) => (
            <div
              key={reg.id}
              className="card bg-[#0b1514] border border-[#122e2a] p-6 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-[#30c4b6] bg-[#102220] border border-[#17403b] px-3 py-1 rounded-full">
                  {reg.ticket_code}
                </span>
                <span className="text-xs text-[#89aca8]">{fmtDate(reg.created_at)}</span>
              </div>

              <div>
                <p className="text-xs font-mono uppercase text-[#89aca8]">{reg.event_name}</p>
                <h3 className="text-2xl text-[#e8f5f3]">{reg.segment_name}</h3>
              </div>

              <div className="text-xs text-[#c5dbd8] space-y-1">
                <p>Institution: {reg.institution} ({reg.class_grade})</p>
                {reg.team_name && <p>Team: {reg.team_name}</p>}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#122e2a]">
                <Link
                  href={`/segments/${reg.segment_id}`}
                  className="text-xs font-mono text-[#30c4b6] hover:underline"
                >
                  View Segment →
                </Link>
                <button
                  type="button"
                  onClick={() => handleCancel(reg)}
                  className="btn btn-xs btn-ghost text-red-400 hover:text-red-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
