import type { SightingFields } from '@/lib/api'
import { cn, formatCurrency } from '@/lib/utils'

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60_000))
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function formatMultiple(multiple: number): string {
  return `${multiple >= 10 ? multiple.toFixed(0) : multiple.toFixed(1)}×`
}

const PENDING = 'Recorded at the next data update'

/** When NodeX first listed the token, and its market cap then. */
export function FirstSeenCell({ token, className }: { token: SightingFields; className?: string }) {
  if (!token.firstSeenAt) {
    return (
      <td className={cn('px-4 py-4 text-sm text-nodex-muted', className)} title={PENDING}>
        —
      </td>
    )
  }
  return (
    <td className={cn('px-4 py-4 text-sm', className)} title={`First seen ${new Date(token.firstSeenAt).toLocaleString()}`}>
      <div className="whitespace-nowrap">{timeAgo(token.firstSeenAt)}</div>
      {token.firstSeenMc ? (
        <div className="whitespace-nowrap text-[11px] text-nodex-muted">at {formatCurrency(token.firstSeenMc, true)}</div>
      ) : null}
    </td>
  )
}

/** Highest multiple since first seen, from prices sampled at each data update. */
export function PeakMultipleCell({ token, className }: { token: SightingFields; className?: string }) {
  const multiple = token.peakMultiple
  if (!multiple) {
    return (
      <td className={cn('px-4 py-4 text-sm text-nodex-muted', className)} title={PENDING}>
        —
      </td>
    )
  }
  return (
    <td
      className={cn('px-4 py-4 text-sm', className)}
      title="Highest price since NodeX first saw this token, divided by its price then. Checked every 2 hours, so short spikes between checks are missed."
    >
      <div
        className={cn(
          'whitespace-nowrap tabular-nums',
          multiple >= 10
            ? 'text-base font-bold text-nodex-green'
            : multiple >= 2
              ? 'font-semibold text-nodex-green'
              : 'text-nodex-muted'
        )}
      >
        {formatMultiple(multiple)}
      </div>
      {token.peakMc && multiple >= 1.05 ? (
        <div className="whitespace-nowrap text-[11px] text-nodex-muted">peak {formatCurrency(token.peakMc, true)}</div>
      ) : null}
    </td>
  )
}
