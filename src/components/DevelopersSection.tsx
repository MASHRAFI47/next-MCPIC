import Image from "next/image";
import { GoHorizontalRule } from "react-icons/go";
import Title from "@/components/Title";
import Reveal from "@/components/Reveal";

const SOCIALS = [
  { label: "Facebook", href: "https://www.facebook.com/mashrafi.binnur" },
  { label: "Instagram", href: "https://www.instagram.com/mashrafi_47" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/mashrafi47/" },
  { label: "GitHub", href: "https://github.com/MASHRAFI47" },
];

export default function DevelopersSection() {
  return (
    <section className="bg-[#080f0e] py-20 border-y-2 border-[#112927]">
      <div className="container mx-auto px-6 md:px-10 lg:px-4">
        <Reveal direction="up">
          <div className="flex flex-col gap-3">
            <p className="tags text-[11px] pt-2 flex items-center font-semibold tracking-widest gap-2">
              <GoHorizontalRule className="scale-x-150" /> MEET THE DEVELOPER
            </p>
            <Title className="uppercase">DEVELOPER</Title>
          </div>
        </Reveal>

        <Reveal direction="up" delay={120}>
          <div className="group card card-side flex flex-col lg:flex-row bg-[#0b1514] border border-[#122e2a] hover:border-[#30c4b6]/50 shadow-sm hover:shadow-xl hover:shadow-[#30c4b6]/10 mt-10 overflow-hidden transition-all duration-300">
            <figure className="relative w-full lg:w-80 shrink-0 h-72 sm:h-96 lg:h-auto overflow-hidden">
              <Image
                src="/images/developer/developer.jpg"
                alt="Mashrafi Bin Nur"
                fill
                sizes="(max-width: 1024px) 100vw, 320px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </figure>

          <div className="card-body">
            <span className="bg-[#102220] self-start text-[#2dbeb1] border border-[#17403b] rounded-2xl text-xs px-3 py-1.5 font-mono">
              FULL STACK WEB DEVELOPER
            </span>

            <h2 className="card-title text-[#e8f5f3] text-4xl tracking-wider mt-2">
              MASHRAFI BIN NUR
            </h2>

            <span className="text-[#a89ec9] text-sm">
              Advisor · Former President · First President of MCPIC
            </span>

            <p className="text-sm leading-6 mt-3">
              As the full stack developer of the Mirpur Cantt Public Information and Technology
              Club Website, the journey of web development led to undertaking this project —
              feeling the necessity of today&apos;s online presence and digital world. This website
              was born out of passion for the club and its vision. A well-crafted website can lead
              members to another level of engagement. Let us promote IT to the next level.
            </p>

            <div className="flex flex-col gap-1 mt-3 text-sm">
              <div>
                <span className="text-[#e8f5f3]">Email: </span>
                <span className="text-[#89aca8]">mashrafibinnur47@gmail.com</span>
              </div>
              <div>
                <span className="text-[#e8f5f3]">Phone: </span>
                <span className="text-[#89aca8]">+8801910467562</span>
              </div>
            </div>

            <div className="card-actions justify-start mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {SOCIALS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm border-[#10312d] bg-transparent hover:bg-[#0c1d1b] hover:border-[#30c4b6] hover:text-[#30c4b6] hover:-translate-y-0.5 text-[#89aca8] rounded-lg transition-all"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
