export function CardsGridSkeleton({
  count = 4,
  cols = "lg:grid-cols-4",
}: {
  count?: number;
  cols?: string;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${cols} gap-6 mt-10 animate-pulse`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-[#0b1514] border border-[#122e2a] overflow-hidden h-[24rem] flex flex-col"
        >
          <div className="h-[54%] w-full bg-[#102220]" />
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-6 w-3/4 rounded bg-[#132c28]" />
              <div className="h-3.5 w-full rounded bg-[#0f2422]" />
              <div className="h-3.5 w-5/6 rounded bg-[#0f2422]" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <div className="h-6 w-20 rounded-full bg-[#102220]" />
              <div className="h-6 w-20 rounded-full bg-[#102220]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PostsPageSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-pulse">
      <div className="lg:col-span-9 space-y-8">
        {/* Featured hero skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-12 bg-[#0b1514] border border-[#122e2a] rounded-2xl overflow-hidden">
          <div className="md:col-span-6 min-h-[260px] md:min-h-[320px] bg-[#102220]" />
          <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="h-3.5 w-24 rounded bg-[#132c28]" />
                <div className="h-3.5 w-20 rounded bg-[#0f2422]" />
              </div>
              <div className="h-8 w-5/6 rounded bg-[#132c28]" />
              <div className="h-4 w-full rounded bg-[#0f2422]" />
              <div className="h-4 w-full rounded bg-[#0f2422]" />
              <div className="h-4 w-2/3 rounded bg-[#0f2422]" />
            </div>
            <div className="h-9 w-36 rounded-xl bg-[#132c28]" />
          </div>
        </div>

        {/* 2-col article cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-[#0b1514] border border-[#122e2a] overflow-hidden"
            >
              <div className="h-52 w-full bg-[#102220]" />
              <div className="p-6 space-y-3">
                <div className="h-3 w-40 rounded bg-[#0f2422]" />
                <div className="h-6 w-4/5 rounded bg-[#132c28]" />
                <div className="h-3.5 w-full rounded bg-[#0f2422]" />
                <div className="h-3.5 w-3/4 rounded bg-[#0f2422]" />
                <div className="pt-3 border-t border-[#122e2a]">
                  <div className="h-3.5 w-24 rounded bg-[#132c28]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar skeleton */}
      <div className="lg:col-span-3 space-y-5">
        <div className="rounded-2xl bg-[#0b1514] border border-[#122e2a] p-6 space-y-4">
          <div className="h-3 w-28 rounded bg-[#132c28]" />
          <div className="h-7 w-40 rounded bg-[#132c28]" />
          <div className="h-3.5 w-full rounded bg-[#0f2422]" />
          <div className="h-11 w-full rounded-xl bg-[#102220]" />
          <div className="h-11 w-full rounded-xl bg-[#102220]" />
        </div>
      </div>
    </div>
  );
}

export function SegmentDetailsSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <div className="space-y-3">
        <div className="h-3.5 w-24 rounded bg-[#132c28]" />
        <div className="h-12 w-72 rounded bg-[#132c28]" />
        <div className="h-4 w-56 rounded bg-[#0f2422]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-3 space-y-5">
          <div className="h-8 w-64 rounded bg-[#132c28]" />
          <div className="w-full h-[350px] rounded-xl bg-[#102220] border border-[#122e2a]" />
          <div className="space-y-2.5 pt-2">
            <div className="h-4 w-full rounded bg-[#0f2422]" />
            <div className="h-4 w-full rounded bg-[#0f2422]" />
            <div className="h-4 w-3/4 rounded bg-[#0f2422]" />
          </div>
        </div>
        <div className="rounded-xl bg-[#0b1514] border border-[#122e2a] p-6 space-y-4 h-fit">
          <div className="h-4 w-28 rounded bg-[#132c28]" />
          <div className="h-12 w-full rounded bg-[#0f2422]" />
          <div className="h-12 w-full rounded bg-[#0f2422]" />
          <div className="h-12 w-full rounded bg-[#0f2422]" />
        </div>
      </div>
    </div>
  );
}

export function TablePageSkeleton({
  rows = 6,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-10 w-52 rounded-lg bg-[#132c28]" />
        <div className="h-9 w-32 rounded-lg bg-[#102220]" />
      </div>
      <div className="bg-[#0b1514] border border-[#122e2a] rounded-xl overflow-hidden">
        <div className="grid grid-cols-5 gap-4 px-5 py-4 border-b border-[#122e2a]">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3.5 w-20 rounded bg-[#132c28]" />
          ))}
        </div>
        <div className="divide-y divide-[#122e2a]">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-11 h-11 rounded-xl bg-[#102220] shrink-0" />
                <div className="space-y-2 flex-1 max-w-xs">
                  <div className="h-4 w-3/4 rounded bg-[#132c28]" />
                  <div className="h-3 w-1/2 rounded bg-[#0f2422]" />
                </div>
              </div>
              <div className="hidden sm:block h-4 w-32 rounded bg-[#0f2422]" />
              <div className="flex gap-2">
                <div className="h-7 w-16 rounded-lg bg-[#102220]" />
                <div className="h-7 w-16 rounded-lg bg-[#102220]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormCardSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="max-w-2xl mx-auto animate-pulse py-6 px-4">
      <div className="rounded-2xl bg-[#0b1514] border border-[#122e2a] p-6 sm:p-8 space-y-5">
        <div className="h-8 w-52 mx-auto rounded bg-[#132c28]" />
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3.5 w-36 rounded bg-[#0f2422]" />
            <div className="h-11 w-full rounded-lg bg-[#102220]" />
          </div>
        ))}
        <div className="h-11 w-full rounded-xl bg-[#132c28] mt-4" />
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
      <div className="h-10 w-64 rounded-lg bg-[#132c28]" />
      <div className="rounded-2xl bg-[#0b1514] border border-[#122e2a] p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-28 h-28 rounded-full bg-[#102220] shrink-0" />
        <div className="space-y-3 flex-1 w-full">
          <div className="h-7 w-48 rounded bg-[#132c28]" />
          <div className="h-4 w-56 rounded bg-[#0f2422]" />
          <div className="flex gap-2 pt-1">
            <div className="h-6 w-20 rounded-full bg-[#102220]" />
            <div className="h-6 w-24 rounded-full bg-[#102220]" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-[#0b1514] border border-[#122e2a] p-6 space-y-4">
        <div className="h-6 w-72 rounded bg-[#132c28]" />
        <div className="h-4 w-full max-w-md rounded bg-[#0f2422]" />
        <div className="h-9 w-32 rounded-lg bg-[#102220]" />
      </div>
      <div className="rounded-2xl bg-[#0b1514] border border-[#122e2a] p-6 space-y-4">
        <div className="h-6 w-48 rounded bg-[#132c28]" />
        <div className="h-11 w-full max-w-md rounded-lg bg-[#102220]" />
        <div className="h-11 w-full max-w-md rounded-lg bg-[#102220]" />
        <div className="h-9 w-36 rounded-lg bg-[#102220]" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <section className="min-h-[70vh] hero-grid py-14 px-6 md:px-10 lg:px-4">
      <div className="container mx-auto space-y-8 animate-pulse">
        <div className="space-y-3">
          <div className="h-3.5 w-28 rounded bg-[#132c28]" />
          <div className="h-12 w-72 rounded bg-[#132c28]" />
          <div className="h-4 w-96 max-w-full rounded bg-[#0f2422]" />
        </div>
        <CardsGridSkeleton count={4} cols="lg:grid-cols-4" />
      </div>
    </section>
  );
}
