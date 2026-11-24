"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import { GoHorizontalRule } from "react-icons/go";
import PublicShell from "@/components/PublicShell";
import Title from "@/components/Title";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiFetch } from "@/lib/api-client";
import type { SegmentRecord } from "@/types/models";

function safeFormat(dateStr?: string): string {
  if (!dateStr) return "TBA";
  const d = new Date(dateStr);
  return isValid(d) ? format(d, "MMM d, yyyy") : "TBA";
}

export default function SegmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const { data: segment, isLoading, error } = useQuery({
    queryKey: ["segment", id],
    enabled: Boolean(id),
    queryFn: () => apiFetch<SegmentRecord>(`/api/segments/${encodeURIComponent(id)}`),
  });

  return (
    <PublicShell>
      <section className="min-h-screen hero-grid py-12 px-6 md:px-10 lg:px-4">
        <div className="container mx-auto">
          {isLoading ? (
            <LoadingSpinner />
          ) : error || !segment ? (
            <div className="py-20 text-center">
              <h2 className="text-3xl text-[#e8f5f3]">Segment Not Found</h2>
              <Link
                href="/events"
                className="btn mt-4 border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
              >
                Back to Events
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 mb-10" data-aos="slide-down">
                <p className="tags text-[11px] pt-2 flex items-center font-semibold tracking-widest gap-2">
                  <GoHorizontalRule className="scale-x-150" /> EVENT
                </p>
                <Title className="uppercase">{segment.event_name || "Event"}</Title>
                <p className="text-[0.95rem]">
                  {segment.event_name} — {segment.name} Details
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                <div className="md:col-span-3">
                  <h2 className="text-3xl mb-4">
                    <span className="text-[#e8f5f3]">Segment Name: </span>
                    <span className="text-[#30c4b6]">{segment.name}</span>
                  </h2>
                  <div className="relative w-full h-[350px] rounded-xl overflow-hidden border border-[#122e2a]">
                    <Image
                      src={segment.image_url}
                      fill
                      sizes="(max-width: 768px) 100vw, 75vw"
                      unoptimized={segment.image_url.startsWith("/api/uploads/")}
                      className="object-cover"
                      alt={segment.name}
                    />
                  </div>
                  <div className="mt-8 whitespace-pre-wrap text-sm leading-relaxed text-[#89aca8] pb-12">
                    <span className="font-bold text-[#e8f5f3] block mb-2">Description:</span>
                    {segment.description}
                  </div>
                </div>

                <div>
                  <div className="border border-[#122e2a] bg-[#0b1514] rounded-xl p-6 sticky top-24">
                    <h5 className="text-[#30c4b6] font-mono text-xs tracking-widest uppercase pb-4">
                      Event Details
                    </h5>
                    <div className="border-b border-[#102b28] py-3">
                      <h6 className="text-[#dee8f6] tracking-widest text-sm">FROM</h6>
                      <p className="text-sm">{safeFormat(segment.start_date)}</p>
                    </div>
                    <div className="border-b border-[#102b28] py-3">
                      <h6 className="text-[#dee8f6] tracking-widest text-sm">TO</h6>
                      <p className="text-sm">{safeFormat(segment.end_date)}</p>
                    </div>
                    <div className="py-3">
                      <h6 className="text-[#dee8f6] tracking-widest text-sm">VENUE</h6>
                      <p className="text-sm">MCPSC Premises</p>
                    </div>
                    {segment.event_slug && (
                      <Link
                        href={`/events/${encodeURIComponent(segment.event_slug)}`}
                        className="btn btn-sm w-full mt-4 border-[#30c4b6] bg-transparent text-[#30c4b6] hover:bg-[#30c4b6] hover:text-[#080f0e]"
                      >
                        All Segments
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
