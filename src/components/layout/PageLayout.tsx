import { type ReactNode } from 'react'

interface PageLayoutProps {
  children: ReactNode
  className?: string
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return <div className={`app-pattern flex min-h-screen flex-col ${className ?? ''}`}>{children}</div>
}
