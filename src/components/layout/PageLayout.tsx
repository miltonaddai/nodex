import { type ReactNode } from 'react'

interface PageLayoutProps {
  children: ReactNode
  className?: string
  /** The dot-grid app background. The landing page turns it off and draws its own. */
  pattern?: boolean
}

export function PageLayout({ children, className, pattern = true }: PageLayoutProps) {
  return (
    <div className={`${pattern ? 'app-pattern' : 'bg-whalemo-bg'} flex min-h-screen flex-col ${className ?? ''}`}>
      {children}
    </div>
  )
}
