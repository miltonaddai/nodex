import { GlassPanel } from '@/components/layout/GlassPanel'
import { Skeleton } from '@/components/ui/skeleton'

const ROW_COUNT = 8

export function TokenTableSkeleton() {
  return (
    <GlassPanel variant="frosted" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04]">
              {Array.from({ length: 8 }).map((_, i) => (
                <th key={i} className="px-4 py-4">
                  <Skeleton className="h-2.5 w-12 rounded-full" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROW_COUNT }).map((_, row) => (
              <tr key={row} className="border-b border-white/[0.06]">
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-5 rounded-full" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-2.5 w-12" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-28" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-14" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-12" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-14" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-10" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  )
}
