import { Skeleton } from "@/components/ui/skeleton";

interface DashboardShellSkeletonProps {
  children: React.ReactNode;
}

export function DashboardShellSkeleton({ children }: DashboardShellSkeletonProps) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#0d0d0d] p-3 md:flex md:flex-col md:gap-3">
        <Skeleton className="h-10 w-full bg-white/5" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full bg-white/5" />
          <Skeleton className="h-10 w-full bg-white/5" />
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
          <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
          <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-white/10 bg-[#0a0a0a]/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-5">
            <Skeleton className="h-9 w-9 bg-white/5" />
            <Skeleton className="h-5 w-24 bg-white/5" />
          </div>
          <div className="ml-6 hidden items-center gap-2 lg:flex">
            {Array.from({ length: 7 }).map((_, idx) => (
              <Skeleton key={idx} className="h-8 w-16 bg-white/5" />
            ))}
          </div>
          <div className="ml-auto">
            <Skeleton className="h-9 w-9 bg-white/5" />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
