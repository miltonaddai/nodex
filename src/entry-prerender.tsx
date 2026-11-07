import { StrictMode, type ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { ThemeProvider } from '@/context/ThemeContext'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'

/** The public pages, prerendered so search engines index them (and can list them as sitelinks). */
const PAGES: Record<string, () => ReactElement> = {
  '/': () => <LandingPage />,
  '/login': () => <LoginPage />,
  '/signup': () => <SignupPage />,
}

export const PRERENDERED_PATHS = Object.keys(PAGES)

/**
 * Renders a public page to HTML at build time (scripts/prerender.mjs), so search engines and link
 * previews get real content instead of an empty root div. Everything else is behind a login. The
 * browser renders the app over this HTML as usual once the JavaScript loads.
 */
export function render(url: string): string {
  const page = PAGES[url]
  if (!page) throw new Error(`No prerendered page for ${url}`)
  return renderToString(
    <StrictMode>
      <ThemeProvider>
        <StaticRouter location={url}>{page()}</StaticRouter>
      </ThemeProvider>
    </StrictMode>
  )
}
