import { type MouseEvent, type ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'

interface LiquidGlassProps {
  children: ReactNode
  className?: string
  interactive?: boolean
  variant?: 'default' | 'solid'
  featured?: boolean
}

/**
 * Glass surface used for the navbar and cards.
 */
export function LiquidGlass({
  children,
  className,
  interactive = false,
  variant = 'default',
  featured = false,
}: LiquidGlassProps) {
  const [light, setLight] = useState({ x: 50, y: 20 })

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!interactive) return
    const rect = event.currentTarget.getBoundingClientRect()
    setLight({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    })
  }

  return (
    <div
      className={cn('relative overflow-hidden', interactive && 'group', className)}
      onMouseMove={handleMouseMove}
    >
      <div
        className={cn(
          'relative rounded-[inherit]',
          variant === 'solid'
            ? cn('glass-panel-solid', featured && 'glass-panel-solid-featured')
            : 'glass-panel',
          interactive && 'transition-transform duration-500 group-hover:-translate-y-1'
        )}
      >
        {interactive && variant === 'default' && (
          <>
            <div
              className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-60 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: `radial-gradient(circle at ${light.x}% ${light.y}%, rgba(255,255,255,.16), rgba(77,230,201,.05) 24%, transparent 54%)`,
              }}
            />
            <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] border border-white/[0.05]" />
          </>
        )}
        {interactive && variant === 'solid' && (
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at ${light.x}% ${light.y}%, rgba(255,255,255,.08), transparent 55%)`,
            }}
          />
        )}
        <div className="relative">{children}</div>
      </div>
    </div>
  )
}
