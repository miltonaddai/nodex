import { useEffect } from 'react'

/** Matches index.html, which is what crawlers that don't run JavaScript see. */
export const DEFAULT_TITLE = 'WhaleMo — Smart Money & Whale Wallet Tracker for Solana & BNB'
export const DEFAULT_DESCRIPTION =
  'See what the most profitable crypto traders are buying on Solana, BNB Chain and Robinhood Chain. Get early-signal alerts and scan any token for rugs before you buy.'

function setMeta(name: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.name = name
    document.head.appendChild(tag)
  }
  tag.content = content
}

/**
 * Sets the page's title, description and indexing for search engines and browser tabs.
 *
 * index.html already carries the landing page's tags (and the prerendered landing HTML), so this
 * updates those tags in place rather than adding a second <title>, which browsers would ignore.
 * Logged-in app pages pass `noindex`: they only show a login redirect to a crawler.
 */
export function Seo({ title, description, noindex = false }: { title?: string; description?: string; noindex?: boolean }) {
  useEffect(() => {
    document.title = title ? `${title} · WhaleMo` : DEFAULT_TITLE
    setMeta('description', description ?? DEFAULT_DESCRIPTION)
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow')
  }, [title, description, noindex])
  return null
}
