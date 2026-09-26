import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TablePaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

function getPageNumbers(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: Array<number | 'ellipsis'> = [1]
  if (page > 3) pages.push('ellipsis')

  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  for (let i = start; i <= end; i += 1) pages.push(i)

  if (page < totalPages - 2) pages.push('ellipsis')
  pages.push(totalPages)
  return pages
}

export function TablePagination({ page, pageSize, total, onPageChange, disabled = false }: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= 0) return null

  const pages = getPageNumbers(page, totalPages)

  return (
    <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-4">
      <p className="text-xs text-nodex-muted">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="dark"
          size="sm"
          className="h-8 w-8 rounded-full p-0"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-xs text-nodex-muted">
              …
            </span>
          ) : (
            <Button
              key={item}
              variant="dark"
              size="sm"
              disabled={disabled}
              className={cn(
                'h-8 min-w-8 rounded-full px-2 text-xs',
                item === page && 'bg-nodex-teal/20 text-nodex-teal border-nodex-teal/30'
              )}
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          )
        )}
        <Button
          variant="dark"
          size="sm"
          className="h-8 w-8 rounded-full p-0"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return hours > 0 ? `${hours}h ${pad(minutes)}m ${pad(seconds)}s` : `${minutes}m ${pad(seconds)}s`
}

/** Live countdown to the worker's next scheduled data refresh. */
function NextUpdateCountdown({ value }: { value: string }) {
  const target = new Date(value).getTime()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (Number.isNaN(target)) return null
  const remaining = target - now
  if (remaining <= 0) {
    return <span className="text-nodex-teal">Update in progress — new data shortly</span>
  }
  return (
    <span>
      Next update in <span className="tabular-nums text-nodex-teal">{formatCountdown(remaining)}</span>
    </span>
  )
}

export function LastUpdated({ value, nextUpdate }: { value: string | null; nextUpdate?: string | null }) {
  if (!value) {
    return <p className="mt-3 text-xs text-nodex-muted">Demo data — live sync not available</p>
  }

  const date = new Date(value)
  const label = Number.isNaN(date.getTime())
    ? value
    : new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        Math.round((date.getTime() - Date.now()) / 60000),
        'minute'
      )

  return (
    <p className="mt-3 text-xs text-nodex-muted">
      Last updated {label} · {date.toLocaleString()}
      {nextUpdate && (
        <>
          {' · '}
          <NextUpdateCountdown value={nextUpdate} />
        </>
      )}
    </p>
  )
}
