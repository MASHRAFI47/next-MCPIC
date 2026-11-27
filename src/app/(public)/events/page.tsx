"use client";

import { useQuery } from "@tanstack/react-query";
import { GoHorizontalRule } from "react-icons/go";
import Title from "@/components/Title";
import Reveal from "@/components/Reveal";
import RecentEventCard from "@/components/Cards/RecentEventCard";
import { CardsGridSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";
import type { EventRecord } from "@/types/models";

export default function EventsPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => apiFetch<EventRecord[]>("/api/events"),
  });

  return (
    <section className="min-h-screen px-6 md:px-10 lg:px-4 py-12 border-y-2 border-[#112927] hero-grid">
        <div className="container mx-auto">
          <Reveal direction="up" immediate>
            <div className="flex flex-col gap-3">
              <p className="tags text-[11px] pt-2 flex items-center font-semibold tracking-widest gap-2">
                <GoHorizontalRule className="scale-x-150" /> ALL EVENTS
              </p>
              <Title className="uppercase">
                Our Festivals &amp; <br /> Competitions
              </Title>
              <p className="text-[0.95rem] mt-2 max-w-xl">
                From intra school/college tech fests to creative competitions — here&apos;s everything
                MCPIC has organized.
              </p>
            </div>
          </Reveal>

          {isLoading ? (
            <CardsGridSkeleton count={4} cols="lg:grid-cols-4" />
          ) : events.length === 0 ? (
            <p className="mt-12 text-[#89aca8]">No events uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
              {events.map((event, idx) => (
                <Reveal key={event.id} direction="up" delay={(idx % 4) * 80} className="h-full">
                  <RecentEventCard event={event} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
  );
}
