"use client";

import { useState } from "react";
import Image from "next/image";
import { GoHorizontalRule } from "react-icons/go";
import Title from "@/components/Title";
import { EXECUTIVE_PANELS } from "@/data/executives";

export default function ExecutivesPage() {
  const [activeYear, setActiveYear] = useState(EXECUTIVE_PANELS[0].year);
  const currentPanel =
    EXECUTIVE_PANELS.find((panel) => panel.year === activeYear) ?? EXECUTIVE_PANELS[0];

  return (
    <section className="py-12 px-6 md:px-10 lg:px-4 hero-grid min-h-screen">
        <div className="container mx-auto">
          <div className="flex flex-col gap-3" data-aos="fade-right">
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

          <div
            role="tablist"
            aria-label="Executive panel years"
            className="flex flex-wrap justify-center gap-2 border-b border-[#30c4b6]/40 pb-3"
          >
            {EXECUTIVE_PANELS.map((panel) => {
              const selected = panel.year === activeYear;
              return (
                <button
                  key={panel.year}
                  role="tab"
                  aria-selected={selected}
                  type="button"
                  onClick={() => setActiveYear(panel.year)}
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

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 items-stretch">
            {currentPanel.members.map((member) => (
              <div
                key={member.id}
                className="card bg-[#0b1514] border border-[#122e2a] shadow-sm h-full overflow-hidden"
              >
                <figure className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 17vw"
                    className="object-cover"
                  />
                </figure>
                <div className="card-body p-4 text-center">
                  <h2 className="text-lg text-[#e8f5f3] tracking-wide leading-tight">
                    {member.name}
                  </h2>
                  <p className="text-[#30c4b6] text-xs">{member.post}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
  );
}
