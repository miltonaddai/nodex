import { type ReactNode, useEffect, useState } from 'react'
import { ThemeContext, type Theme } from '@/context/theme-context'

function getInitialTheme(): Theme {
  if (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light') {
    return 'light'
  }
  return 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    try {
      localStorage.setItem('nodex-theme', theme)
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  }, [theme])

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')) }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
