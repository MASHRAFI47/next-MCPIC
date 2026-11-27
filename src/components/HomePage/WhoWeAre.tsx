import { GoHorizontalRule } from "react-icons/go";
import Title from "@/components/Title";
import Reveal from "@/components/Reveal";
import SectorCard from "@/components/Cards/SectorCard";

const SECTORS = [
  {
    number: "01",
    icon: "💻",
    title: "Website Development",
    subtitle: "Design and build full-featured web projects from scratch.",
  },
  {
    number: "02",
    icon: "🎬",
    title: "Multimedia Presentation",
    subtitle: "Craft compelling visual and video narratives.",
  },
  {
    number: "03",
    icon: "🎨",
    title: "Photoshop & Design",
    subtitle: "Visual design, graphics, and digital artistry.",
  },
  {
    number: "04",
    icon: "📊",
    title: "Microsoft Excel",
    subtitle: "Data analysis and spreadsheet mastery.",
  },
];

export default function WhoWeAre() {
  return (
    <section className="py-20 bg-gradient-radial from-[#080f0e] via-[#0b1514] to-[#080f0e] border-y-2 border-[#112927]">
      <div className="container mx-auto px-6 md:px-10 lg:px-4">
        <Reveal direction="up">
          <div className="flex flex-col gap-3">
            <p className="tags text-[11px] pt-2 flex items-center font-semibold tracking-widest gap-2">
              <GoHorizontalRule className="scale-x-150" /> WHO WE ARE
            </p>
            <Title>OUR SECTORS</Title>
            <p className="text-[0.95rem]">
              Shine your skills across a range of technical disciplines.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {SECTORS.map((s, idx) => (
            <Reveal key={s.number} direction="zoom" delay={idx * 90} className="h-full">
              <SectorCard
                number={s.number}
                icon={s.icon}
                cardTitle={s.title}
                cardSubTitle={s.subtitle}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
