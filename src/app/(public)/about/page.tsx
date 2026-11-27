"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { GoHorizontalRule } from "react-icons/go";
import Title from "@/components/Title";
import Reveal from "@/components/Reveal";
import DevelopersSection from "@/components/DevelopersSection";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function AboutPage() {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    fetch("/animations/aboutAnimation.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setAnimationData(data))
      .catch(() => {});
  }, []);

  return (
    <div className="pt-12 hero-grid" id="about">
      <div className="container mx-auto px-6 md:px-10 lg:px-4 grid grid-cols-1 md:grid-cols-2 items-center gap-10 mb-14">
        <Reveal direction="up" immediate>
          <div className="flex flex-col gap-3">
            <p className="tags text-[11px] pt-2 flex items-center font-semibold tracking-widest gap-2">
              <GoHorizontalRule className="scale-x-150" /> ABOUT US
            </p>
            <Title className="uppercase">
              Fostering a <br /> Community of <br /> Future Leaders
            </Title>
            <p className="text-[0.95rem] mt-3 leading-relaxed">
              <span className="text-[#e8f5f3] font-semibold">
                Mirpur Cantt Public Information and Technology Club
              </span>{" "}
              is dedicated to fostering a community of innovative thinkers, tech enthusiasts, and
              future leaders in the fields of information technology and computer science.
              <br />
              <br />
              Our mission is to provide members with opportunities for learning, collaboration,
              and professional growth — equipping them with the skills and knowledge necessary to
              thrive in the rapidly evolving tech landscape.
            </p>
          </div>
        </Reveal>

        <Reveal direction="left" delay={150} immediate className="flex justify-center">
          {animationData && <Lottie animationData={animationData} className="w-3/4 max-w-md" loop />}
        </Reveal>
      </div>

      <DevelopersSection />
    </div>
  );
}
