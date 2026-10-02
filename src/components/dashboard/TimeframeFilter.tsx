import { cn } from '@/lib/utils'

const periods = ['24H', '7D', '30D', 'All'] as const
export type Period = (typeof periods)[number]

interface TimeframeFilterProps {
  value: Period
  onChange: (period: Period) => void
}

export function TimeframeFilter({ value, onChange }: TimeframeFilterProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-nodex-surface border border-nodex-line">
      {periods.map((period) => (
        <button
          key={period}
          onClick={() => onChange(period)}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300',
            value === period
              ? 'bg-nodex-accent text-nodex-on-accent'
              : 'text-nodex-muted hover:text-white'
          )}
        >
          {period}
        </button>
      ))}
    </div>
  )
}
