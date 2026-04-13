import { DashboardShellSkeleton } from "@/components/loading/dashboard-shell-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

function HeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40 bg-white/5" />
        <Skeleton className="h-4 w-64 bg-white/5" />
      </div>
      {withAction && <Skeleton className="h-10 w-28 bg-white/5" />}
    </div>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-full max-w-sm bg-white/5" />
      <Skeleton className="h-10 w-10 bg-white/5" />
      <Skeleton className="h-10 w-20 bg-white/5" />
    </div>
  );
}

function FeatureCardGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="space-y-4 rounded-xl border border-white/10 bg-[#111111] p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-5 rounded-full bg-white/10" />
            <Skeleton className="h-5 w-20 bg-white/10" />
          </div>
          <Skeleton className="h-5 w-3/4 bg-white/10" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-12 bg-white/10" />
            <Skeleton className="h-4 w-16 bg-white/10" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14 rounded-full bg-white/10" />
            <Skeleton className="h-5 w-14 rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardRouteSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-44 bg-white/5" />
          <Skeleton className="h-5 w-80 bg-white/5" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="space-y-3 rounded-xl border border-white/10 bg-[#111111] p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-4 w-4 rounded-full bg-white/10" />
              </div>
              <Skeleton className="h-7 w-16 bg-white/10" />
              <Skeleton className="h-4 w-28 bg-white/10" />
            </div>
          ))}
        </div>
        <section className="grid gap-4 xl:grid-cols-7">
          <div className="xl:col-span-4">
            <div className="space-y-3 rounded-xl border border-white/10 bg-[#111111] p-4">
              <Skeleton className="h-5 w-28 bg-white/10" />
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-14 w-full bg-white/10" />
              ))}
            </div>
          </div>
          <div className="xl:col-span-3">
            <div className="space-y-3 rounded-xl border border-white/10 bg-[#111111] p-4">
              <Skeleton className="h-5 w-32 bg-white/10" />
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-16 w-full bg-white/10" />
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardShellSkeleton>
  );
}

export function IdeasRouteSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div className="space-y-6">
        <HeaderSkeleton />
        <FilterBarSkeleton />
        <FeatureCardGridSkeleton />
      </div>
    </DashboardShellSkeleton>
  );
}

export function TasksRouteSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div className="space-y-6">
        <HeaderSkeleton />
        <FilterBarSkeleton />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="w-72 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 bg-white/5" />
                <Skeleton className="h-5 w-8 bg-white/5" />
              </div>
              <div className="space-y-3 rounded-xl border border-white/10 bg-[#111111] p-3">
                {Array.from({ length: 3 }).map((__, cardIdx) => (
                  <div key={cardIdx} className="space-y-3 rounded-lg border border-white/10 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Skeleton className="h-4 w-28 bg-white/10" />
                      <Skeleton className="h-4 w-14 bg-white/10" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-16 bg-white/10" />
                      <Skeleton className="h-3 w-14 bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShellSkeleton>
  );
}

export function CalendarRouteSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div className="space-y-6">
        <HeaderSkeleton />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-xl border border-white/10 bg-[#111111] p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 bg-white/10" />
                <Skeleton className="h-9 w-9 bg-white/10" />
                <Skeleton className="h-6 w-36 bg-white/10" />
              </div>
              <Skeleton className="h-8 w-16 bg-white/10" />
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, idx) => (
                <Skeleton key={idx} className="h-20 w-full bg-white/5" />
              ))}
            </div>
          </div>
          <div className="space-y-4 rounded-xl border border-white/10 bg-[#111111] p-5">
            <Skeleton className="h-6 w-32 bg-white/10" />
            <Skeleton className="h-8 w-24 bg-white/10" />
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-16 w-full bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    </DashboardShellSkeleton>
  );
}

export function TimeRouteSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div className="space-y-6">
        <HeaderSkeleton withAction={false} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 rounded-xl border border-white/10 bg-[#111111] p-6 lg:col-span-2">
            <div className="space-y-2">
              <Skeleton className="h-6 w-24 bg-white/10" />
              <Skeleton className="h-4 w-52 bg-white/10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 bg-white/10" />
              <Skeleton className="h-10 w-full bg-white/10" />
            </div>
            <Skeleton className="mx-auto h-14 w-72 bg-white/10" />
            <Skeleton className="mx-auto h-11 w-32 bg-white/10" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="space-y-3 rounded-xl border border-white/10 bg-[#111111] p-4">
                <Skeleton className="h-4 w-16 bg-white/10" />
                <Skeleton className="h-8 w-20 bg-white/10" />
                <Skeleton className="h-2 w-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-xl border border-white/10 bg-[#111111] p-5">
          <Skeleton className="h-6 w-44 bg-white/10" />
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between py-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36 bg-white/10" />
                <Skeleton className="h-3 w-20 bg-white/10" />
              </div>
              <Skeleton className="h-4 w-10 bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </DashboardShellSkeleton>
  );
}

export function ReportsRouteSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div className="space-y-6">
        <HeaderSkeleton />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="space-y-3 rounded-xl border border-white/10 bg-[#111111] p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-4 w-4 rounded-full bg-white/10" />
              </div>
              <Skeleton className="h-7 w-20 bg-white/10" />
              <Skeleton className="h-4 w-16 bg-white/10" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="space-y-4 rounded-xl border border-white/10 bg-[#111111] p-5">
              <Skeleton className="h-6 w-32 bg-white/10" />
              <Skeleton className="h-4 w-48 bg-white/10" />
              <div className="flex h-[200px] items-end gap-3">
                {Array.from({ length: 5 }).map((__, barIdx) => (
                  <Skeleton key={barIdx} className="w-full bg-white/10" style={{ height: `${45 + barIdx * 15}px` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-xl border border-white/10 bg-[#111111] p-5">
          <Skeleton className="h-6 w-40 bg-white/10" />
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 bg-white/10" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-white/10" />
                  <Skeleton className="h-3 w-20 bg-white/10" />
                </div>
              </div>
              <Skeleton className="h-5 w-10 bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </DashboardShellSkeleton>
  );
}

export function SettingsRouteSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div className="space-y-6">
        <HeaderSkeleton withAction={false} />
        <div className="space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-9 w-24 bg-white/5" />
            ))}
          </div>
          <div className="grid gap-6">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="space-y-4 rounded-xl border border-white/10 bg-[#111111] p-5">
                <Skeleton className="h-6 w-32 bg-white/10" />
                <Skeleton className="h-4 w-56 bg-white/10" />
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full bg-white/10" />
                  <Skeleton className="h-10 w-full bg-white/10" />
                </div>
                <Skeleton className="h-10 w-28 bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShellSkeleton>
  );
}
