"use client";

import { useQuery } from "@tanstack/react-query";
import { GoHorizontalRule } from "react-icons/go";
import Title from "@/components/Title";
import RecentEventCard from "@/components/Cards/RecentEventCard";
import { apiFetch } from "@/lib/api-client";
import type { EventRecord } from "@/types/models";

export default function RecentEvents() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => apiFetch<EventRecord[]>("/api/events"),
  });

  return (
    <section className="py-20 bg-[#080f0e] border-b border-[#112927]">
      <div className="container mx-auto px-6 md:px-10 lg:px-4">
        <div className="flex flex-col gap-3" data-aos="slide-up">
          <p className="tags text-[11px] pt-2 flex items-center font-semibold tracking-widest gap-2">
            <GoHorizontalRule className="scale-x-150" /> FEATURED
          </p>
          <Title>RECENT EVENTS</Title>
          <p className="text-[0.95rem]">Where MCPIC made its mark.</p>
        </div>

        {isLoading ? (
          <div className="py-16 flex justify-center">
            <span className="loading loading-spinner text-[#2dbeb1] w-10" />
          </div>
        ) : events.length === 0 ? (
          <p className="mt-10 text-sm text-[#89aca8]">No events published yet. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {events.slice(0, 3).map((event) => (
              <RecentEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
