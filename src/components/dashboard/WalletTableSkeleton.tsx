import { GlassPanel } from '@/components/layout/GlassPanel'
import { Skeleton } from '@/components/ui/skeleton'

const ROW_COUNT = 8

export function WalletTableSkeleton() {
  return (
    <GlassPanel variant="frosted" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04]">
              {Array.from({ length: 9 }).map((_, i) => (
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
                    <Skeleton className="h-4 w-28" />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-14" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-10" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-8" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-10" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-14" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-20" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  )
}
