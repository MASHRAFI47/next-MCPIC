"use client";

import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { TablePageSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";
import type { EventRecord } from "@/types/models";

function fmt(value: string, pattern = "P"): string {
  const d = new Date(value);
  return isValid(d) ? format(d, pattern) : "—";
}

export default function AllEventsPage() {
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: () => apiFetch<EventRecord[]>("/api/events"),
  });

  const deleteEvent = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/events/${id}`, { method: "DELETE" }),
    onSuccess: () => refetch(),
  });

  const handleDelete = async (eve: EventRecord) => {
    const confirm = await Swal.fire({
      title: `Delete "${eve.name}"?`,
      text: "This will also delete all segments linked to this event!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteEvent.mutateAsync(eve.id);
      await Swal.fire("Deleted!", "The event and its segments have been deleted.", "success");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  if (isLoading) return <TablePageSkeleton rows={5} cols={5} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl text-[#e8f5f3]">All Events</h1>
        <Link
          href="/dashboard/add-event"
          className="btn btn-sm border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
        >
          + Add Event
        </Link>
      </div>

      <div className="overflow-x-auto bg-[#0b1514] border border-[#122e2a] rounded-xl">
        <table className="table">
          <thead>
            <tr className="text-[#30c4b6]">
              <th>Event</th>
              <th>Added By</th>
              <th>From</th>
              <th>To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[#89aca8]">
                  No events created yet.
                </td>
              </tr>
            ) : (
              events.map((eve) => (
                <tr key={eve.id} className="border-[#122e2a]">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="mask mask-squircle w-12 h-12 relative">
                          <Image
                            src={eve.image_url}
                            alt={eve.name}
                            fill
                            sizes="48px"
                            unoptimized={eve.image_url.startsWith("/api/uploads/")}
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-[#e8f5f3]">{eve.name}</div>
                        <div className="text-xs opacity-60">{fmt(eve.created_at, "PPp")}</div>
                      </div>
                    </div>
                  </td>
                  <td>{eve.created_by_name}</td>
                  <td>{fmt(eve.start_date)}</td>
                  <td>{fmt(eve.end_date)}</td>
                  <td className="space-x-2">
                    <Link
                      href={`/dashboard/all-event-segments/${eve.id}`}
                      className="btn btn-success text-white btn-xs"
                    >
                      Segments
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(eve)}
                      className="btn btn-error text-white btn-xs"
                    >
                      Delete
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
