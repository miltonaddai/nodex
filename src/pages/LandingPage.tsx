import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Coins,
  ScanEye,
  ScanSearch,
  Star,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { SUBSCRIPTIONS_ENABLED } from '@/lib/subscriptions-enabled'
import { cn } from '@/lib/utils'
import { SignupLink } from '@/components/auth/SignupLink'

const facts = [
  { value: '250', label: 'top traders followed' },
  { value: '2', label: 'chains covered' },
  { value: '2h', label: 'between data updates' },
]

/** Brand icons are served from public/logos so the page makes no third-party image requests. */
const sources = [
  { name: 'Birdeye', logo: '/logos/birdeye.png' },
  { name: 'Helius', logo: '/logos/helius.png' },
  { name: 'Dexscreener', logo: '/logos/dexscreener.png' },
  { name: 'FOMO', logo: '/logos/fomo.png' },
  { name: 'Blockscout', logo: '/logos/blockscout.png' },
]

type Tone = 'brand' | 'teal' | 'amber' | 'sky' | 'green'

/** Card, icon chip, body text and link colors per feature, so each card has its own color. */
const TONES: Record<Tone, { card: string; chip: string; body: string; link: string }> = {
  brand: {
    card: 'border-transparent bg-gradient-to-br from-nodex-accent to-nodex-blue text-[#ffffff]',
    chip: 'bg-[#ffffff]/15 text-[#ffffff]',
    body: 'text-[#ffffff]/80',
    link: 'text-[#ffffff]',
  },
  teal: {
    card: 'border-nodex-teal/25 bg-nodex-teal/[0.08] hover:border-nodex-teal/50',
    chip: 'bg-nodex-accent text-nodex-on-accent',
    body: 'text-nodex-muted',
    link: 'text-nodex-teal',
  },
  amber: {
    card: 'border-nodex-amber/25 bg-nodex-amber/[0.07] hover:border-nodex-amber/50',
    chip: 'bg-nodex-amber/15 text-nodex-amber',
    body: 'text-nodex-muted',
    link: 'text-nodex-amber',
  },
  sky: {
    card: 'border-nodex-sky/25 bg-nodex-sky/[0.08] hover:border-nodex-sky/50',
    chip: 'bg-nodex-sky/15 text-nodex-sky',
    body: 'text-nodex-muted',
    link: 'text-nodex-sky',
  },
  green: {
    card: 'border-nodex-green/25 bg-nodex-green/[0.07] hover:border-nodex-green/50',
    chip: 'bg-nodex-green/15 text-nodex-green',
    body: 'text-nodex-muted',
    link: 'text-nodex-green',
  },
}

const features = [
  {
    icon: Users,
    title: 'What top traders are buying',
    description:
      'Follow the 250 most profitable traders on FOMO and see which tokens they are net buying right now. The more of them in a token, the higher it ranks.',
    to: '/wallets',
    wide: true,
    tone: 'brand' as Tone,
  },
  {
    icon: ScanSearch,
    title: 'Token scanner',
    description:
      'Paste any contract for liquidity, mint and freeze controls, transfer fees, top holders and their wallets, and a buy or avoid verdict.',
    to: '/scanner',
    wide: false,
    tone: 'teal' as Tone,
  },
  {
    icon: ScanEye,
    title: 'Insider plays',
    description:
      'Launches bought by one person through many wallets: co-signed buys, shared funders and bags split into fresh wallets. See whether insiders still hold.',
    to: '/insiders',
    wide: false,
    tone: 'amber' as Tone,
  },
  {
    icon: Coins,
    title: 'Organic token discovery',
    description:
      'New tokens screened by trader churn, which separates real traders from bot farms that inflate holder counts and volume.',
    to: '/tokens',
    wide: false,
    tone: 'sky' as Tone,
  },
  {
    icon: Star,
    title: 'Live watchlist',
    description: 'Track tokens and wallets with live price, market cap, 24h change, balance and 7-day PnL.',
    to: '/watchlist',
    wide: false,
    tone: 'green' as Tone,
  },
]

const steps = [
  { title: 'Spot it', description: 'See where top traders are putting money, and which new tokens trade organically.' },
  { title: 'Check it', description: 'Scan the contract for rugs, insider bundles, fees and concentrated supply.' },
  { title: 'Track it', description: 'Add it to your watchlist and follow price and the wallets behind it.' },
]

const plans = [
  {
    name: 'Starter',
    price: '$29',
    description: 'The essentials for finding your edge.',
    features: ['Top traders buying', 'Token discovery', 'Token scanner', '10 tracked wallets'],
    featured: false,
  },
  {
    name: 'Pro',
    price: '$49',
    description: 'Deeper signals for serious on-chain traders.',
    features: ['Everything in Starter', 'Insider plays', 'Unlimited watchlists', 'Robinhood Chain and BNB Chain coverage'],
    featured: true,
  },
]

const faqs = [
  {
    question: 'Which chains does NodeX cover?',
    answer:
      'Solana, Robinhood Chain and BNB Chain. Token discovery, the scanner and top-trader tracking work on all three. Launch bundle detection covers Solana, where several wallets signing one transaction proves common control.',
  },
  {
    question: 'Who are the top traders?',
    answer:
      'The 250 most profitable traders on FOMO, taken from its leaderboards and refreshed monthly. They are named, public traders, which avoids the bots, token deployers and burner wallets that dominate raw on-chain profit rankings.',
  },
  {
    question: 'How does the scanner decide buy or avoid?',
    answer:
      'It checks for the traps behind most losses: pulled or thin liquidity, contracts that can still mint or freeze, transfer fees that can be raised, supply held by a few wallets, bot-farm trading and launch insiders who still hold. Any critical finding means avoid.',
  },
  {
    question: 'Is NodeX financial advice?',
    answer:
      'No. NodeX is on-chain research. A clean scan means none of the known traps were found, not that a price will go up. Use it as one input to your own decisions.',
  },
]

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: 'easeOut' as const },
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.2em] text-nodex-teal">{children}</span>
}

/** Sample rows for the hero preview. Illustrative only, not live data. */
const previewRows = [
  { symbol: 'NOVA', traders: 14, mc: '$7.1M', change: '+42%', up: true },
  { symbol: 'KITE', traders: 11, mc: '$18.4M', change: '+6%', up: true },
  { symbol: 'ORBIT', traders: 9, mc: '$2.3M', change: '-12%', up: false },
  { symbol: 'PIXL', traders: 7, mc: '$940K', change: '+118%', up: true },
]

/** A static, flat mock of the product, so the hero shows what the app does. */
function ProductPreview() {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-nodex-line bg-nodex-surface">
        <div className="flex items-center justify-between border-b border-nodex-line px-5 py-3.5">
          <span className="text-sm font-semibold">What top traders are buying</span>
          <span className="rounded-full border border-nodex-line px-2 py-0.5 text-[11px] text-nodex-muted">Sample</span>
        </div>
        <div className="divide-y divide-nodex-line">
          {previewRows.map((row, index) => (
            <motion.div
              key={row.symbol}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.35 + index * 0.08, ease: 'easeOut' }}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-6 px-5 py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nodex-raised text-xs font-bold text-nodex-teal">
                  {row.symbol[0]}
                </span>
                <div>
                  <div className="font-medium">{row.symbol}</div>
                  <div className="text-xs text-nodex-muted">{row.mc} market cap</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-semibold text-nodex-teal">{row.traders}</span>
                <span className="ml-1 text-xs text-nodex-muted">traders</span>
              </div>
              <span className={cn('w-14 text-right text-sm font-medium tabular-nums', row.up ? 'text-nodex-green' : 'text-nodex-red')}>
                {row.change}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="absolute top-full -left-6 -mt-3 hidden w-64 rounded-2xl border border-nodex-line bg-nodex-surface p-4 sm:block">
        <div className="mb-2 flex items-center gap-2 text-nodex-amber">
          <TriangleAlert className="h-4 w-4" />
          <span className="text-sm font-bold">Caution</span>
          <span className="ml-auto text-[11px] text-nodex-muted">Risk 49/100</span>
        </div>
        <ul className="space-y-1.5 text-xs">
          <li className="flex gap-2">
            <span className="rounded border border-nodex-red/30 px-1 text-[10px] font-semibold uppercase text-nodex-red">High</span>
            Transfer fee can be raised
          </li>
          <li className="flex gap-2 text-nodex-muted">
            <Check className="h-3.5 w-3.5 shrink-0 text-nodex-green" />
            Mint authority revoked
          </li>
        </ul>
      </div>
    </div>
  )
}

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <PageLayout>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="px-4 pt-32 pb-24 md:px-8 md:pt-40 md:pb-32">
          <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-nodex-line bg-nodex-surface px-3 py-1 text-xs text-nodex-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-nodex-accent" />
                On-chain intelligence for Solana, Robinhood Chain and BNB Chain
              </span>
              <h1 className="mb-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                Trade what the best traders buy, <span className="text-nodex-teal">not what bots pump.</span>
              </h1>
              <p className="mb-10 max-w-xl text-lg leading-8 text-nodex-muted">
                NodeX follows the most profitable traders on-chain, screens new tokens for real demand and checks any contract
                for rugs and insider bundles before you buy.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="group h-12 px-7">
                  <SignupLink>
                    Get started
                    <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </SignupLink>
                </Button>
                <Button asChild size="lg" variant="dark" className="h-12 px-7">
                  <a href="#features">See what it does</a>
                </Button>
              </div>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-nodex-line pt-8">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-2xl font-bold">{fact.value}</dt>
                    <dd className="mt-1 text-xs leading-5 text-nodex-muted">{fact.label}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="pb-8 sm:pb-20"
            >
              <ProductPreview />
            </motion.div>
          </div>
        </section>

        {/* Data sources */}
        <section className="border-y border-nodex-line bg-nodex-surface px-4 py-8 md:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-nodex-muted">Built on data from</span>
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
              {sources.map((source) => (
                <span key={source.name} className="flex items-center gap-2.5 text-base font-semibold text-nodex-muted">
                  <img
                    src={source.logo}
                    alt=""
                    width={28}
                    height={28}
                    loading="lazy"
                    className="h-7 w-7 rounded-lg bg-[#ffffff] ring-1 ring-nodex-line"
                  />
                  {source.name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-4 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-6xl">
            <motion.div {...reveal} className="mb-14 max-w-2xl">
              <Eyebrow>Features</Eyebrow>
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Everything you check before a trade, in one place</h2>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  {...reveal}
                  transition={{ ...reveal.transition, delay: index * 0.07 }}
                  whileHover={{ y: -6 }}
                  className={cn(feature.wide && 'md:col-span-2')}
                >
                  <Link
                    to={feature.to}
                    className={cn(
                      'group relative flex h-full flex-col overflow-hidden rounded-2xl border p-7 transition-[border-color,box-shadow] duration-300 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.5)]',
                      TONES[feature.tone].card
                    )}
                  >
                    {feature.tone === 'brand' ? (
                      <span aria-hidden className="absolute -right-16 -bottom-24 h-64 w-64 rounded-full bg-[#ffffff]/[0.07]" />
                    ) : null}
                    <motion.span
                      whileHover={{ rotate: -8, scale: 1.08 }}
                      className={cn('relative mb-6 flex h-11 w-11 items-center justify-center rounded-xl', TONES[feature.tone].chip)}
                    >
                      <feature.icon className="h-5 w-5" />
                    </motion.span>
                    <h3 className="relative mb-2 text-lg font-semibold">{feature.title}</h3>
                    <p className={cn('relative flex-1 text-sm leading-6', TONES[feature.tone].body)}>{feature.description}</p>
                    <span className={cn('relative mt-6 inline-flex items-center gap-1 text-sm font-medium', TONES[feature.tone].link)}>
                      Open
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-y border-nodex-line bg-nodex-surface px-4 py-24 md:px-8">
          <div className="mx-auto max-w-6xl">
            <motion.div {...reveal} className="mb-14 max-w-2xl">
              <Eyebrow>How it works</Eyebrow>
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">From signal to decision in three steps</h2>
            </motion.div>
            <ol className="grid gap-10 md:grid-cols-3">
              {steps.map((step, index) => (
                <motion.li key={step.title} {...reveal} transition={{ ...reveal.transition, delay: index * 0.05 }}>
                  <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-nodex-teal/40 text-sm font-bold text-nodex-teal">
                    {index + 1}
                  </span>
                  <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                  <p className="text-sm leading-6 text-nodex-muted">{step.description}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing: only while the paywall is switched on. */}
        {SUBSCRIPTIONS_ENABLED ? (
          <section id="pricing" className="px-4 py-24 md:px-8 md:py-32">
            <div className="mx-auto max-w-6xl">
              <motion.div {...reveal} className="mb-14 text-center">
                <Eyebrow>Pricing</Eyebrow>
                <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Simple monthly plans</h2>
              </motion.div>
              <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
                {plans.map((plan) => (
                  <motion.div
                    key={plan.name}
                    {...reveal}
                    className={cn(
                      'flex flex-col rounded-2xl border bg-nodex-surface p-8',
                      plan.featured ? 'border-nodex-teal' : 'border-nodex-line'
                    )}
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">NodeX {plan.name}</h3>
                      {plan.featured ? (
                        <span className="rounded-full bg-nodex-accent px-2.5 py-0.5 text-[11px] font-bold uppercase text-nodex-on-accent">
                          Most popular
                        </span>
                      ) : null}
                    </div>
                    <div className="mb-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-nodex-muted"> /month</span>
                    </div>
                    <p className="mb-6 text-sm text-nodex-muted">{plan.description}</p>
                    <ul className="mb-8 flex-1 space-y-3 border-t border-nodex-line pt-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm">
                          <Check className="h-4 w-4 text-nodex-teal" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant={plan.featured ? 'default' : 'outline'} className="w-full">
                      <SignupLink to={`/signup?plan=${plan.name.toLowerCase()}`}>Choose {plan.name}</SignupLink>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* FAQ */}
        <section id="faq" className="px-4 py-24 md:px-8 md:py-32">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            <motion.div {...reveal}>
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Questions, answered</h2>
            </motion.div>
            <motion.div {...reveal} className="divide-y divide-nodex-line border-y border-nodex-line">
              {faqs.map((faq, index) => {
                const open = openFaq === index
                return (
                  <div key={faq.question}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : index)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-6 py-5 text-left text-base font-medium transition-colors hover:text-nodex-teal"
                    >
                      {faq.question}
                      <ChevronDown className={cn('h-4 w-4 shrink-0 text-nodex-muted transition-transform', open && 'rotate-180')} />
                    </button>
                    <AnimatePresence initial={false}>
                      {open ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-2xl pb-5 text-sm leading-7 text-nodex-muted">{faq.answer}</p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                )
              })}
            </motion.div>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="px-4 pb-24 md:px-8">
          <motion.div
            {...reveal}
            className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-2xl bg-nodex-blue px-8 py-12 text-[#ffffff] md:flex-row md:items-center md:px-12"
          >
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Check your next token before you buy it.</h2>
              <p className="mt-2 opacity-80">Free to start. Scan any Solana, Robinhood Chain or BNB Chain contract in seconds.</p>
            </div>
            <SignupLink className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#ffffff] px-6 py-3 text-sm font-semibold text-nodex-blue transition-opacity hover:opacity-90">
              Get started <ArrowRight className="h-4 w-4" />
            </SignupLink>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-nodex-line px-4 py-10 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-nodex-muted sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="text-lg font-semibold text-nodex-foreground">
            NodeX
          </Link>
          <div className="flex flex-wrap gap-x-7 gap-y-3">
            <a href="#features" className="transition-colors hover:text-nodex-teal">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-nodex-teal">How it works</a>
            {SUBSCRIPTIONS_ENABLED ? (
              <a href="#pricing" className="transition-colors hover:text-nodex-teal">Pricing</a>
            ) : null}
            <a href="#faq" className="transition-colors hover:text-nodex-teal">FAQ</a>
            <Link to="/login" className="transition-colors hover:text-nodex-teal">Login</Link>
          </div>
          <span>© {new Date().getFullYear()} NodeX</span>
        </div>
      </footer>
    </PageLayout>
  )
}
