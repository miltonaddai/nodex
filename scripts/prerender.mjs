// Runs after `vite build` (see the "build" script). Makes the site crawlable:
//   1. renders the public pages to HTML: the landing page into dist/index.html ("/"), and the
//      login and signup pages into dist/login.html and dist/signup.html, each with its own title,
//      description and canonical link, so search engines index them (and can show them as sitelinks);
//   2. writes dist/app.html, the empty app shell (noindex) that every other route falls back to;
//   3. fills in the site's address in the meta tags, and writes robots.txt and sitemap.xml.
//
// The address comes from SITE_URL, or from URL, which Netlify sets during builds to the site's
// main address (the custom domain once one is set). Without either, absolute URLs are left out.

import { readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const ssrOut = path.join(root, 'dist-prerender')

const siteUrl = (process.env.SITE_URL || process.env.URL || '').trim().replace(/\/+$/, '')
if (!siteUrl) {
  console.warn('[prerender] No SITE_URL or URL set: canonical links and the sitemap are skipped.')
}

// 1. Build a server bundle of the landing page and render it.
await build({
  root,
  logLevel: 'warn',
  build: {
    ssr: 'src/entry-prerender.tsx',
    outDir: ssrOut,
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: 'entry-prerender.mjs' } },
  },
})
const { render } = await import(pathToFileURL(path.join(ssrOut, 'entry-prerender.mjs')).href)

/** Each public page's file and head. Titles and descriptions match what components/Seo sets. */
const pages = [
  { path: '/', file: 'index.html' },
  {
    path: '/login',
    file: 'login.html',
    title: 'Log in · WhaleMo',
    description: 'Log in to WhaleMo to see what the most profitable crypto traders are buying on Solana, BNB Chain and Robinhood Chain.',
  },
  {
    path: '/signup',
    file: 'signup.html',
    title: 'Sign up · WhaleMo',
    description:
      'Create a WhaleMo account to follow smart money on Solana, BNB Chain and Robinhood Chain, get early-signal alerts and scan tokens before you buy.',
  },
]
const rendered = new Map(pages.map((page) => [page.path, render(page.path)]))
await rm(ssrOut, { recursive: true, force: true })

// 2. Fill in the address. With none, drop the tags that need an absolute URL.
const template = await readFile(path.join(dist, 'index.html'), 'utf8')
const withAddress = (html) =>
  siteUrl
    ? html.replaceAll('__SITE_URL__', siteUrl)
    : html
        .replace(/\s*<link rel="canonical"[^>]*>/, '')
        .replace(/\s*<meta property="og:url"[^>]*>/, '')
        .replaceAll('__SITE_URL__', '')

// The app shell: same head, but not for indexing (these routes need a login), and no canonical.
const shell = withAddress(template)
  .replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex" />')
  .replace(/\s*<link rel="canonical"[^>]*>/, '')
await writeFile(path.join(dist, 'app.html'), shell)

const escapeAttr = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
/** The template's head, with a page's own title, description and address. */
function headFor(html, page) {
  if (!page.title) return html
  const title = escapeAttr(page.title)
  const description = escapeAttr(page.description)
  const url = `${siteUrl}${page.path}`
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, `<meta name="description" content="${description}" />`)
    .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${title}" />`)
    .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${description}" />`)
    .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/, siteUrl ? `<meta property="og:url" content="${url}" />` : '')
    .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/, siteUrl ? `<link rel="canonical" href="${url}" />` : '')
}

for (const page of pages) {
  const base = headFor(withAddress(template), page)
  const html = base.replace('<div id="root"></div>', `<div id="root">${rendered.get(page.path)}</div>`)
  if (html === base) throw new Error('[prerender] Could not find <div id="root"></div> in dist/index.html')
  await writeFile(path.join(dist, page.file), html)
}

// 3. robots.txt and sitemap.xml. App routes need a login, so crawlers are kept to the public pages.
const privatePaths = ['/wallets', '/insiders', '/scanner', '/watchlist', '/alerts', '/settings', '/billing', '/pricing', '/forgot-password', '/reset-password']
await writeFile(
  path.join(dist, 'robots.txt'),
  ['User-agent: *', 'Allow: /', ...privatePaths.map((p) => `Disallow: ${p}`), ...(siteUrl ? ['', `Sitemap: ${siteUrl}/sitemap.xml`] : []), ''].join('\n')
)
if (siteUrl) {
  const today = new Date().toISOString().slice(0, 10)
  const pages = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/signup', priority: '0.6', changefreq: 'monthly' },
    { loc: '/login', priority: '0.3', changefreq: 'yearly' },
  ]
  await writeFile(
    path.join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
      .map((p) => `  <url><loc>${siteUrl}${p.loc}</loc><lastmod>${today}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`)
      .join('\n')}\n</urlset>\n`
  )
}

console.log(
  `[prerender] Prerendered ${pages.map((page) => `${page.path} (${Math.round(rendered.get(page.path).length / 1024)} KB)`).join(', ')}${siteUrl ? ` for ${siteUrl}` : ''}.`
)
