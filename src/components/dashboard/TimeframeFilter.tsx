import { cn } from '@/lib/utils'

const periods = ['24H', '7D', '30D', 'All'] as const
export type Period = (typeof periods)[number]

interface TimeframeFilterProps {
  value: Period
  onChange: (period: Period) => void
}

export function TimeframeFilter({ value, onChange }: TimeframeFilterProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-nodex-surface/80 border border-white/5">
      {periods.map((period) => (
        <button
          key={period}
          onClick={() => onChange(period)}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300',
            value === period
              ? 'bg-nodex-teal text-nodex-bg shadow-[0_0_20px_rgba(77,230,201,0.3)]'
              : 'text-nodex-muted hover:text-white'
          )}
        >
          {period}
        </button>
      ))}
    </div>
  )
}
