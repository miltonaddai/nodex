import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  hover?: boolean
  variant?: 'default' | 'solid' | 'frosted'
  featured?: boolean
}

export function GlassPanel({
  children,
  className,
  hover = false,
  variant = 'default',
  featured = false,
}: GlassPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'rounded-2xl',
        variant === 'solid'
          ? cn('glass-panel-solid', featured && 'glass-panel-solid-featured')
          : variant === 'frosted'
            ? 'glass-panel-frosted'
            : 'glass-panel',
        hover &&
          variant === 'default' &&
          'transition-all duration-300 hover:border-nodex-teal/30 hover:shadow-[0_0_40px_rgba(77,230,201,0.08)]',
        className
      )}
    >
      {children}
    </motion.div>
  )
}
