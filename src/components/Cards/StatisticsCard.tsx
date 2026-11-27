import type { ReactNode } from "react";

interface StatisticsCardProps {
  icon: ReactNode;
  title: string;
  amount: number;
  bgColor: string;
}

export default function StatisticsCard({
  icon,
  title,
  amount,
  bgColor,
}: StatisticsCardProps) {
  return (
    <div className="p-8 bg-[#0b1514] border border-[#122e2a] shadow-xl rounded-xl relative flex items-center justify-between">
      <div className={`p-4 ${bgColor} rounded-xl text-white`}>{icon}</div>
      <div className="text-end">
        <h2 className="text-[#89aca8] text-xl tracking-wide">{title}</h2>
        <p className="text-3xl font-bold text-[#e8f5f3]">{amount}</p>
      </div>
    </div>
  );
}
