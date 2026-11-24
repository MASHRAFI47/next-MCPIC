const ITEMS = [
  "Website Development",
  "Cybersecurity",
  "Multimedia Presentation",
  "Photoshop & Design",
  "Microsoft Excel",
  "CyberSprint 3.0",
  "MegaFest",
  "Innovation · Technology · Community",
];

export default function Marquee() {
  const repeated = [...ITEMS, ...ITEMS];

  return (
    <div className="overflow-hidden border-y border-[#122e2a] bg-[#0c1917] py-6 relative">
      <div className="marquee-track">
        {repeated.map((label, idx) => (
          <div
            key={`${label}-${idx}`}
            className="text-[11px] tracking-[0.12em] uppercase text-[#89aca8] flex items-center gap-4 leading-none font-mono"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#30c4b6] shrink-0 inline-block" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
