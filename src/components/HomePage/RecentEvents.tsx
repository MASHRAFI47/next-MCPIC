"use client";

import { useQuery } from "@tanstack/react-query";
import { GoHorizontalRule } from "react-icons/go";
import Title from "@/components/Title";
import Reveal from "@/components/Reveal";
import RecentEventCard from "@/components/Cards/RecentEventCard";
import { CardsGridSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";
import type { EventRecord } from "@/types/models";

export default function RecentEvents({
  initialEvents,
}: {
  initialEvents?: EventRecord[];
}) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["recent-events"],
    queryFn: () => apiFetch<EventRecord[]>("/api/events"),
    initialData: initialEvents,
    staleTime: 60_000,
  });

  return (
    <section className="py-20 bg-[#080f0e] border-b border-[#112927]">
      <div className="container mx-auto px-6 md:px-10 lg:px-4">
        <Reveal direction="up">
          <div className="flex flex-col gap-3">
            <p className="tags text-[11px] pt-2 flex items-center font-semibold tracking-widest gap-2">
              <GoHorizontalRule className="scale-x-150" /> FEATURED
            </p>
            <Title>RECENT EVENTS</Title>
            <p className="text-[0.95rem]">Where MCPIC made its mark.</p>
          </div>
        </Reveal>

        {isLoading ? (
          <CardsGridSkeleton count={3} cols="lg:grid-cols-3" />
        ) : events.length === 0 ? (
          <p className="mt-10 text-sm text-[#89aca8]">No events published yet. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {events.slice(0, 3).map((event, idx) => (
              <Reveal key={event.id} direction="up" delay={idx * 100} className="h-full">
                <RecentEventCard event={event} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
