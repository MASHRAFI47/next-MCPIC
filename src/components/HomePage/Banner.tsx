"use client";

import Link from "next/link";
import { GoHorizontalRule } from "react-icons/go";
import { MdArrowRightAlt } from "react-icons/md";
import Reveal from "@/components/Reveal";

export default function Banner() {
  return (
    <div className="lg:min-h-[88vh] hero-grid py-12 flex items-center overflow-hidden">
      <div className="container mx-auto px-6 md:px-10 lg:px-4">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-6">
            <Reveal direction="down" delay={0} duration={500} immediate>
              <p className="tags text-[11px] pt-2 flex items-center gap-2 tracking-widest">
                <GoHorizontalRule className="scale-x-150" /> MCPIC · Est. 2022
              </p>
            </Reveal>

            <div className="pt-8 leading-none">
              <Reveal direction="up" delay={80} duration={650} immediate>
                <h1 className="text-6xl md:text-[4.5rem] lg:text-[6rem] text-white leading-none">
                  Discover
                </h1>
              </Reveal>
              <Reveal direction="up" delay={170} duration={650} immediate>
                <h1 className="text-6xl md:text-[4.5rem] lg:text-[6rem] text-[#30c3b6] leading-none">
                  New Events
                </h1>
              </Reveal>
              <Reveal direction="up" delay={260} duration={650} immediate>
                <h1 className="text-6xl md:text-[4.5rem] lg:text-[6rem] leading-none bg-gradient-to-r from-[#0f82c0] to-[#cc00b8] bg-clip-text text-transparent">
                  And Blogs.
                </h1>
              </Reveal>
            </div>

            <Reveal direction="up" delay={340} duration={650} immediate>
              <p className="pt-6 max-w-xl leading-relaxed">
                MCPIC is dedicated to fostering a community of innovative thinkers, tech
                enthusiasts, and future leaders in information technology and computer science.
              </p>
            </Reveal>

            <Reveal direction="up" delay={420} duration={650} immediate>
              <div className="pt-8 flex flex-wrap gap-4">
                <Link
                  href="/events"
                  className="group btn text-sm font-semibold px-6 border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92] hover:border-[#30c4b6] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#30c4b6]/25 transition-all"
                >
                  Explore Events{" "}
                  <MdArrowRightAlt className="text-lg transition-transform duration-200 group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/about"
                  className="btn text-sm text-white px-6 border-[#0f2422] bg-transparent hover:bg-[#0c1d1b]/60 hover:border-[#30c4b6] hover:text-[#30c4b6] hover:-translate-y-0.5 transition-all"
                >
                  About the club
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="md:col-span-1 hidden md:block" />

          <div className="md:col-span-5 flex justify-center items-center">
            <Reveal direction="left" delay={200} duration={750} immediate className="w-full relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-3 rounded-3xl bg-[#30c4b6]/10 blur-2xl"
              />
              <div className="animate-float-slow relative mockup-code w-full bg-[#0a1714] border border-[#122e2a] hover:border-[#30c4b6]/40 shadow-2xl shadow-[#30c4b6]/5 text-xs space-y-2 text-[#8a92b2] transition-colors">
                <pre className="text-[#5c6280] pl-6">
                  <code>{"// MCPIC Event System"}</code>
                </pre>
                <pre data-prefix="">
                  <code>
                    <span className="text-[#7d60fe]">const</span>{" "}
                    <span className="text-[#0eb8df]">club</span> = &#123;
                  </code>
                </pre>
                <pre data-prefix="">
                  <code>
                    {"  "}name: <span className="text-[#51ff8e]">&quot;MCPIC&quot;</span>,
                  </code>
                </pre>
                <pre data-prefix="">
                  <code>
                    {"  "}since: <span className="text-[#fecc51]">2022</span>,
                  </code>
                </pre>
                <pre data-prefix="">
                  <code>
                    {"  "}events: <span className="text-[#02b9df]">await</span> fetch(
                    <span className="text-[#51ff8e]">&quot;/api/events&quot;</span>),
                  </code>
                </pre>
                <pre data-prefix="">
                  <code>
                    {"  "}members: <span className="text-[#fecc51]">150</span>
                    <span className="text-[#51ff8e]">+</span>,
                  </code>
                </pre>
                <pre data-prefix="">
                  <code>&#125;;</code>
                </pre>
                <pre data-prefix="">
                  <code>&nbsp;</code>
                </pre>
                <pre data-prefix="">
                  <code>
                    <span className="text-[#02b9df]">club</span>.
                    <span className="text-[#02b9df]">nextEvent</span>()
                    <span className="cursor-blink">|</span>
                  </code>
                </pre>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
