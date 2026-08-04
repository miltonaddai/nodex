import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean
}

export function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md bg-white/[0.06]',
        shimmer && 'skeleton-shimmer',
        className
      )}
      {...props}
    />
  )
}
