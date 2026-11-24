"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiFetch } from "@/lib/api-client";
import type { SegmentRecord } from "@/types/models";

export default function AllEventSegmentsPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params?.eventId ?? "";

  const { data: segments = [], isLoading, refetch } = useQuery({
    queryKey: ["segments", eventId],
    enabled: Boolean(eventId),
    queryFn: () =>
      apiFetch<SegmentRecord[]>(`/api/segments?eventId=${encodeURIComponent(eventId)}`),
  });

  const deleteSegment = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/segments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Segment deleted successfully");
      refetch();
    },
  });

  const handleDelete = async (segment: SegmentRecord) => {
    const confirm = await Swal.fire({
      title: `Delete "${segment.name}"?`,
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteSegment.mutateAsync(segment.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete segment");
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl text-[#e8f5f3]">Event Segments</h1>
        <Link
          href="/dashboard/add-event-segment"
          className="btn btn-sm border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
        >
          + Add Segment
        </Link>
      </div>

      {segments.length === 0 ? (
        <p className="text-[#89aca8]">No segments uploaded for this event yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((segment) => (
            <div
              key={segment.id}
              className="card bg-[#0b1514] border border-[#122e2a] shadow-xl overflow-hidden"
            >
              <figure className="relative h-44 w-full overflow-hidden">
                <Image
                  src={segment.image_url}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized={segment.image_url.startsWith("/api/uploads/")}
                  className="object-cover"
                  alt={segment.name}
                />
              </figure>
              <div className="card-body">
                <h2 className="card-title text-2xl text-[#e8f5f3]">{segment.name}</h2>
                <p className="text-sm line-clamp-2">{segment.description}</p>
                <div className="card-actions justify-end pt-2">
                  <Link
                    href={`/segments/${segment.id}`}
                    className="btn btn-sm border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
                  >
                    View
                  </Link>
                  <Link
                    href={`/dashboard/update-event-segment/${segment.id}`}
                    className="btn btn-sm btn-success text-white"
                    aria-label="Edit segment"
                  >
                    <FaRegEdit />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(segment)}
                    className="btn btn-sm btn-error text-white"
                    aria-label="Delete segment"
                  >
                    <FaRegTrashAlt />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
