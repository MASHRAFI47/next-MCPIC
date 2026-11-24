"use client";

import Image from "next/image";
import { GoHorizontalRule } from "react-icons/go";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import Title from "@/components/Title";

const ACHIEVEMENTS = [
  "/images/achievements/achievement5.jpg",
  "/images/achievements/achievement6.jpg",
  "/images/achievements/achievement7.jpeg",
  "/images/achievements/achievement1.jpg",
  "/images/achievements/achievement2.jpg",
  "/images/achievements/achievement3.jpg",
  "/images/achievements/achievement4.jpg",
];

export default function Achievements() {
  return (
    <section className="bg-gradient-radial from-[#080f0e] via-[#0b1514] to-[#080f0e] border-y-2 border-[#112927] py-16">
      <div className="container mx-auto px-6 md:px-10 lg:px-4">
        <div className="flex flex-col gap-3" data-aos="slide-up">
          <p className="tags text-[11px] pt-2 flex items-center font-semibold tracking-widest gap-2">
            <GoHorizontalRule className="scale-x-150" /> BRILLIANT MINDS
          </p>
          <Title>ACHIEVEMENTS</Title>
          <p className="text-[0.95rem]">Our achievements from various institutions.</p>
        </div>

        <div className="mt-6" data-aos="fade-down">
          <Swiper
            effect="coverflow"
            grabCursor
            centeredSlides
            slidesPerView="auto"
            initialSlide={3}
            coverflowEffect={{
              rotate: 50,
              stretch: 0,
              depth: 100,
              modifier: 1,
              slideShadows: true,
            }}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}
            pagination={{ clickable: true }}
            modules={[EffectCoverflow, Pagination, Autoplay]}
            className="achievement-swiper"
          >
            {ACHIEVEMENTS.map((src, idx) => (
              <SwiperSlide key={src} className="achievement-slide relative overflow-hidden rounded-xl">
                <Image
                  src={src}
                  alt={`MCPIC achievement ${idx + 1}`}
                  fill
                  sizes="300px"
                  className="object-cover rounded-xl"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
