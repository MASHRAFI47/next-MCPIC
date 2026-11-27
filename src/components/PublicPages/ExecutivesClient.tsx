"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { GoHorizontalRule } from "react-icons/go";
import Title from "@/components/Title";
import Reveal from "@/components/Reveal";
import { CardsGridSkeleton } from "@/components/Skeletons";
import { EXECUTIVE_PANELS, type ExecutivePanel } from "@/data/executives";
import { apiFetch } from "@/lib/api-client";
import type { ExecutiveMemberRecord } from "@/types/models";

export default function ExecutivesClient({
  initialMembers,
}: {
  initialMembers: ExecutiveMemberRecord[];
}) {
  const { data: dbMembers, isLoading } = useQuery({
    queryKey: ["executives"],
    queryFn: () => apiFetch<ExecutiveMemberRecord[]>("/api/executives"),
    initialData: initialMembers.length > 0 ? initialMembers : undefined,
    staleTime: 120_000,
  });

  const panels: ExecutivePanel[] = useMemo(() => {
    if (dbMembers && dbMembers.length > 0) {
      const byYear = new Map<string, ExecutivePanel>();
      for (const m of dbMembers) {
        if (!byYear.has(m.panel_year)) {
          byYear.set(m.panel_year, { year: m.panel_year, members: [] });
        }
        byYear.get(m.panel_year)!.members.push({
          id: m.id,
          name: m.name,
          post: m.post,
          image: m.image_url,
        });
      }
      return Array.from(byYear.values()).sort((a, b) => b.year.localeCompare(a.year));
    }
    return EXECUTIVE_PANELS;
  }, [dbMembers]);

  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const activeYear =
    selectedYear && panels.some((p) => p.year === selectedYear)
      ? selectedYear
      : panels[0]?.year ?? "";
  const currentPanel = panels.find((p) => p.year === activeYear) ?? panels[0];

  return (
    <section className="py-12 px-6 md:px-10 lg:px-4 hero-grid min-h-screen">
      <div className="container mx-auto">
        <Reveal direction="up" immediate>
          <div className="flex flex-col gap-3">
            <p className="tags text-[11px] pt-2 flex items-center font-semibold tracking-widest gap-2">
              <GoHorizontalRule className="scale-x-150" /> THE TEAM
            </p>
            <Title className="uppercase">
              EXECUTIVE <br /> COMMITTEE
            </Title>
            <p className="text-[0.95rem] mt-2 mb-8">
              Meet the driven individuals leading MCPIC forward.
            </p>
          </div>
        </Reveal>

        {isLoading ? (
          <CardsGridSkeleton count={6} cols="lg:grid-cols-6" />
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Executive panel years"
              className="flex flex-wrap justify-center gap-2 border-b border-[#30c4b6]/40 pb-3"
            >
              {panels.map((panel) => {
                const selected = panel.year === activeYear;
                return (
                  <button
                    key={panel.year}
                    role="tab"
                    aria-selected={selected}
                    type="button"
                    onClick={() => setSelectedYear(panel.year)}
                    className={`px-4 py-2 rounded-lg font-heading text-xl tracking-wider transition-colors ${
                      selected
                        ? "bg-[#102220] text-[#30c4b6] border border-[#30c4b6]"
                        : "text-[#2dbeb1] hover:bg-[#102220]/60 border border-transparent"
                    }`}
                  >
                    {panel.year}
                  </button>
                );
              })}
            </div>

            {currentPanel && (
              <div
                key={activeYear}
                className="mt-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 items-stretch"
              >
                {currentPanel.members.map((member, idx) => (
                  <Reveal
                    key={`${activeYear}-${member.id}`}
                    direction="up"
                    delay={(idx % 6) * 45}
                    duration={450}
                    className="h-full"
                  >
                    <div className="group card bg-[#0b1514] border border-[#122e2a] hover:border-[#30c4b6]/60 shadow-sm hover:shadow-xl hover:shadow-[#30c4b6]/10 h-full overflow-hidden transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1">
                      <figure className="relative h-48 w-full overflow-hidden">
                        <Image
                          src={member.image}
                          alt={member.name}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 17vw"
                          unoptimized={member.image.startsWith("/api/uploads/")}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </figure>
                      <div className="card-body p-4 text-center">
                        <h2 className="text-lg text-[#e8f5f3] tracking-wide leading-tight">
                          {member.name}
                        </h2>
                        <p className="text-[#30c4b6] text-xs">{member.post}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
