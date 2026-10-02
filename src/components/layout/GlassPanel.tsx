import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  hover?: boolean
  variant?: 'default' | 'solid' | 'frosted'
  featured?: boolean
}

/**
 * A flat card: solid surface and a 1px line (see the surface classes in index.css). The name and
 * variants are kept from the earlier glass design so existing pages need no changes.
 */
export function GlassPanel({ children, className, hover = false, variant = 'default', featured = false }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        variant === 'solid'
          ? cn('glass-panel-solid', featured && 'glass-panel-solid-featured')
          : variant === 'frosted'
            ? 'glass-panel-frosted'
            : 'glass-panel',
        hover && 'transition-colors duration-200 hover:border-nodex-teal/40',
        className
      )}
    >
      {children}
    </div>
  )
}
