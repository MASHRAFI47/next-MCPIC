export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-56 rounded-lg bg-[#0f2422]" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-[#0b1514] border border-[#122e2a]"
          />
        ))}
      </div>
    </div>
  );
}
