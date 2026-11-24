import type { ReactNode } from "react";

interface TitleProps {
  children: ReactNode;
  className?: string;
}

export default function Title({ children, className = "" }: TitleProps) {
  return (
    <h1
      className={`text-4xl md:text-[4rem] text-[#e8f5f3] leading-none ${className}`}
      data-aos="slide-up"
      data-aos-duration="800"
    >
      {children}
    </h1>
  );
}
