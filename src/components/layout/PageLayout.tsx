import { type ReactNode } from 'react'
import { ConstellationBackground } from './ConstellationBackground'

interface PageLayoutProps {
  children: ReactNode
  className?: string
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-nodex-bg relative isolate overflow-hidden ${className ?? ''}`}>
      <ConstellationBackground />
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  )
}
