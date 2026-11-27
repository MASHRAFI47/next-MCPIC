import Link from "next/link";
import Image from "next/image";
import type { SegmentRecord } from "@/types/models";

export default function SegmentCard({ segment }: { segment: SegmentRecord }) {
  const preview =
    segment.description.length <= 80
      ? segment.description
      : `${segment.description.slice(0, 80)}...`;

  return (
    <Link href={`/segments/${segment.id}`} className="block h-full group">
      <section className="card bg-[#0c1917] border border-[#122e2a] hover:border-[#30c4b6]/60 shadow-sm hover:shadow-xl hover:shadow-[#30c4b6]/10 h-[24rem] overflow-hidden transition-[transform,border-color,box-shadow] duration-300 group-hover:-translate-y-1.5">
        <figure className="relative h-[58%] w-full overflow-hidden">
          <Image
            src={segment.image_url}
            alt={segment.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized={segment.image_url.startsWith("/api/uploads/")}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </figure>
        <div className="card-body h-[42%] p-5">
          <h2 className="card-title text-[#e8f5f3] text-2xl line-clamp-1">
            {segment.name}
          </h2>
          <p className="text-xs sm:text-sm text-[#89aca8] line-clamp-2">{preview}</p>
        </div>
      </section>
    </Link>
  );
}
