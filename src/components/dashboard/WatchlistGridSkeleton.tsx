import { Skeleton } from '@/components/ui/skeleton'

function WatchlistCardSkeleton() {
  return (
    <div className="watch-card rounded-2xl p-5">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        </div>
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4 rounded-xl bg-nodex-raised px-3 py-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-2 w-10 rounded-full" />
            <Skeleton className="h-5 w-14" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

interface WatchlistGridSkeletonProps {
  count?: number
}

export function WatchlistGridSkeleton({ count = 6 }: WatchlistGridSkeletonProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <WatchlistCardSkeleton key={i} />
      ))}
    </div>
  )
}
