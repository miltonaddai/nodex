import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { ThemeProvider } from '@/context/ThemeContext'
import { LandingPage } from '@/pages/LandingPage'

/**
 * Renders the landing page to HTML at build time (scripts/prerender.mjs), so search engines and
 * link previews get the real content instead of an empty root div. Only the landing page is
 * prerendered: every other route is behind a login. The browser renders the app over this HTML
 * as usual once the JavaScript loads.
 */
export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <ThemeProvider>
        <StaticRouter location={url}>
          <LandingPage />
        </StaticRouter>
      </ThemeProvider>
    </StrictMode>
  )
}
