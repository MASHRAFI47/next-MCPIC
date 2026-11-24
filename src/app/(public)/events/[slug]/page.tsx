"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { GoHorizontalRule } from "react-icons/go";
import Title from "@/components/Title";
import SegmentCard from "@/components/Cards/SegmentCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiFetch } from "@/lib/api-client";
import type { EventRecord, SegmentRecord } from "@/types/models";

interface EventWithSegmentsResponse {
  event: EventRecord;
  segments: SegmentRecord[];
}

export default function EventSegmentsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["event-slug", slug],
    enabled: Boolean(slug),
    queryFn: () =>
      apiFetch<EventWithSegmentsResponse>(`/api/events/slug/${encodeURIComponent(slug)}`),
  });

  return (
    <section className="min-h-screen hero-grid py-12 px-6 md:px-10 lg:px-4">
        <div className="container mx-auto">
          {isLoading ? (
            <LoadingSpinner />
          ) : error || !data ? (
            <div className="py-20 text-center">
              <h2 className="text-3xl text-[#e8f5f3]">Event Not Found</h2>
              <Link
                href="/events"
                className="btn mt-4 border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
              >
                Back to Events
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 mb-10">
                <p className="tags text-[11px] flex items-center font-semibold tracking-widest gap-2">
                  <GoHorizontalRule className="scale-x-150" /> EVENT SEGMENTS
                </p>
                <Title className="uppercase">{data.event.name}</Title>
                <p className="max-w-2xl text-sm">{data.event.description}</p>
              </div>

              {data.segments.length === 0 ? (
                <p className="text-[#89aca8]">No segments uploaded for this event yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {data.segments.map((segment) => (
                    <SegmentCard key={segment.id} segment={segment} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
  );
}
