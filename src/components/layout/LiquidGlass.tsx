import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface LiquidGlassProps {
  children: ReactNode
  className?: string
  /** Kept for existing callers. Flat surfaces only change their border on hover. */
  interactive?: boolean
  variant?: 'default' | 'solid'
  featured?: boolean
}

/**
 * A flat surface for cards. The name is kept from the earlier glass design, which had a
 * mouse-following light effect and blur. Both are gone.
 */
export function LiquidGlass({ children, className, interactive = false, variant = 'default', featured = false }: LiquidGlassProps) {
  return (
    <div
      className={cn(
        'overflow-hidden',
        variant === 'solid' ? cn('glass-panel-solid', featured && 'glass-panel-solid-featured') : 'glass-panel',
        interactive && 'transition-colors duration-200 hover:border-whalemo-teal/40',
        className
      )}
    >
      {children}
    </div>
  )
}
