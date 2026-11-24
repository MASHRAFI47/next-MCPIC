"use client";

import Link from "next/link";
import Image from "next/image";
import { format, isValid } from "date-fns";
import { MdArrowRightAlt } from "react-icons/md";
import type { EventRecord } from "@/types/models";

function safeFormatDate(value: string): string {
  const date = new Date(value);
  return isValid(date) ? format(date, "dd/MM/yyyy") : "TBA";
}

export default function RecentEventCard({ event }: { event: EventRecord }) {
  const preview =
    event.description.length > 75
      ? `${event.description.slice(0, 75)}...`
      : event.description;

  return (
    <Link href={`/events/${encodeURIComponent(event.slug)}`} className="block h-full">
      <section
        className="card bg-[#0c1917] border border-[#122e2a] hover:border-[#30c4b6]/60 shadow-sm h-[25rem] overflow-hidden transition-colors"
        data-aos="flip-left"
        data-aos-duration="900"
      >
        <figure className="relative h-[52%] w-full overflow-hidden">
          <Image
            src={event.image_url}
            alt={event.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized={event.image_url.startsWith("/api/uploads/")}
            className="object-cover"
          />
        </figure>
        <div className="card-body h-[48%] p-5 flex flex-col justify-between">
          <div>
            <h2 className="card-title text-[#e8f5f3] text-2xl tracking-wide line-clamp-1">
              {event.name}
            </h2>
            <p className="text-sm mt-1 line-clamp-2">{preview}</p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <span className="bg-[#102220] text-[#2dbeb1] border border-[#17403b] rounded-2xl text-xs px-3 py-1">
              {safeFormatDate(event.start_date)}
            </span>
            <MdArrowRightAlt className="text-[#89aca8]" />
            <span className="bg-[#102220] text-[#2dbeb1] border border-[#17403b] rounded-2xl text-xs px-3 py-1">
              {safeFormatDate(event.end_date)}
            </span>
          </div>
        </div>
      </section>
    </Link>
  );
}
