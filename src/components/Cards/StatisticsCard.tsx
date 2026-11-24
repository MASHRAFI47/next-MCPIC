import type { IconType } from "react-icons";

interface StatisticsCardProps {
  icon: IconType;
  title: string;
  amount: number;
  bgColor: string;
}

export default function StatisticsCard({
  icon: Icon,
  title,
  amount,
  bgColor,
}: StatisticsCardProps) {
  return (
    <div className="p-8 bg-[#0b1514] border border-[#122e2a] shadow-xl rounded-xl relative flex items-center justify-between">
      <div className={`p-4 ${bgColor} rounded-xl`}>
        <Icon className="text-white" size={24} />
      </div>
      <div className="text-end">
        <h2 className="text-[#89aca8] text-xl tracking-wide">{title}</h2>
        <p className="text-3xl font-bold text-[#e8f5f3]">{amount}</p>
      </div>
    </div>
  );
}
