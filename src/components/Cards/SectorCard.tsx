"use client";

import { useRef } from "react";

interface SectorCardProps {
  number: string;
  icon: string;
  cardTitle: string;
  cardSubTitle: string;
}

export default function SectorCard({
  number,
  icon,
  cardTitle,
  cardSubTitle,
}: SectorCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -10;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 10;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="my-6 mx-1 transition-transform duration-200 ease-out"
      style={{ transformStyle: "preserve-3d", willChange: "transform" }}
    >
      <div className="card bg-[#0c1917] border border-[#0f2d29] hover:border-[#30c4b6]/60 hover:shadow-2xl hover:shadow-[#30c4b6]/10 text-white h-full transition-all duration-300">
        <div className="card-body">
          <div className="mb-2">
            <p className="text-xs font-mono text-[#30c4b6]">{number}</p>
          </div>
          <div className="text-3xl mb-1">{icon}</div>
          <h3 className="text-[#e8f5f3] text-xl tracking-wide">{cardTitle}</h3>
          <p className="text-xs leading-relaxed">{cardSubTitle}</p>
        </div>
      </div>
    </div>
  );
}
