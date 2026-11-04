import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Minus, Plus } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { SignupLink } from '@/components/auth/SignupLink'
import { RisingBars, SignalField } from '@/components/landing/canvas'
import { StoryScroll } from '@/components/landing/StoryScroll'
import { Crosshairs, ProductWindow, Rule } from '@/components/landing/visuals'
import { PLANS } from '@/lib/plans'
import { SUBSCRIPTIONS_ENABLED } from '@/lib/subscriptions-enabled'
import { cn } from '@/lib/utils'

const plan = PLANS[0]
const signupTo = SUBSCRIPTIONS_ENABLED ? `/signup?plan=${plan.id}` : '/signup'
const ctaLabel = SUBSCRIPTIONS_ENABLED ? `Start for $${plan.price}/month` : 'Get started'

const buttonBase =
  'group inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 text-sm font-semibold transition-all duration-200 active:scale-[0.98]'
const primaryButton = cn(buttonBase, 'bg-whalemo-accent text-whalemo-on-accent hover:brightness-110')
const lightButton = cn(buttonBase, 'bg-whalemo-foreground text-whalemo-bg hover:opacity-90')

function PrimaryCta({ className }: { className?: string }) {
  return (
    <SignupLink to={signupTo} className={cn(primaryButton, className)}>
      {ctaLabel}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </SignupLink>
  )
}

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
}

function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('text-xs font-medium uppercase tracking-[0.2em] text-whalemo-teal', className)}>{children}</span>
}

/** Product facts only. No user counts or testimonials we can't back up. */
const stats = [
  { value: '1000+', label: 'Top trading wallets tracked', tone: 'bg-whalemo-accent text-whalemo-on-accent' },
  { value: '3', label: 'Chains: Solana, Robinhood, BNB', tone: 'bg-whalemo-surface' },
  { value: '2h', label: 'Between data refreshes', tone: 'bg-whalemo-raised' },
  { value: `$${plan.price}`, label: 'A month for everything', tone: 'bg-whalemo-foreground text-whalemo-bg' },
]

const without = [
  'Buying what trends, after the bots that faked the volume',
  'Finding out about the insider bundle when they dump',
  'Learning the fee can be raised when you try to sell',
  'Refreshing charts all day, hoping to be early',
]

const withWhaleMo = [
  'Buying what the most profitable traders are buying',
  'Seeing insider clusters before you touch the token',
  'A buy or avoid verdict on any contract in seconds',
  'An alert when top traders pile into a small cap',
]

const faqs = [
  {
    question: `What do I get for $${plan.price} a month?`,
    answer:
      'Everything: Smart Wallets, insider plays, the token scanner, early-signal alerts and unlimited watchlists on Solana, Robinhood Chain and BNB Chain. No tiers and no add-ons.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. Cancel from your billing page whenever you like. No contracts and no emails to send.',
  },
  {
    question: 'Who are the top traders?',
    answer:
      'The most profitable named, public traders, refreshed monthly. Because they are real people with track records, the list skips the bots, token deployers and burner wallets that dominate raw on-chain profit rankings.',
  },
  {
    question: 'How does the scanner decide buy or avoid?',
    answer:
      'It checks for the traps behind most losses: pulled or thin liquidity, contracts that can still mint or freeze, transfer fees that can be raised, supply held by a few wallets, bot-farm trading and launch insiders who still hold. Any critical finding means avoid.',
  },
  {
    question: 'Is WhaleMo financial advice?',
    answer:
      'No. WhaleMo is on-chain research. A clean scan means none of the known traps were found, not that a price will go up. Use it as one input to your own decisions.',
  },
]

function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="border-t border-whalemo-line">
      {faqs.map((faq, index) => {
        const isOpen = open === index
        return (
          <div key={faq.question} className="border-b border-whalemo-line">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-medium transition-colors hover:text-whalemo-teal md:text-xl"
            >
              {faq.question}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-whalemo-line">
                {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-6 text-base leading-7 text-whalemo-muted">{faq.answer}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

function LandingFooter() {
  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'Smart Wallets', href: '#product' },
        { label: 'Insider plays', href: '#product' },
        { label: 'Token scanner', href: '#product' },
        { label: 'Watchlist', href: '#product' },
      ],
    },
    {
      title: 'WhaleMo',
      links: [
        ...(SUBSCRIPTIONS_ENABLED ? [{ label: 'Pricing', href: '#pricing' }] : []),
        { label: 'FAQ', href: '#faq' },
      ],
    },
  ]
  return (
    <footer className="relative overflow-hidden bg-whalemo-accent text-[#ffffff]">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-16 md:grid-cols-[1fr_auto] md:px-8 md:pt-20">
        <div>
          <BrandLogo variant="icon" className="h-10" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-[#ffffff]/75">
            Follow the most profitable traders on-chain and skip the rugs.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-16 gap-y-10 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <div className="mb-3 text-sm text-[#ffffff]/55">{column.title}</div>
              <ul className="space-y-2 text-sm font-medium">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="transition-opacity hover:opacity-70">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <div className="mb-3 text-sm text-[#ffffff]/55">Account</div>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <Link to="/login" className="transition-opacity hover:opacity-70">Log in</Link>
              </li>
              <li>
                <SignupLink to={signupTo} className="transition-opacity hover:opacity-70">Sign up</SignupLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-16 flex max-w-7xl items-center justify-between gap-4 px-4 text-xs text-[#ffffff]/60 md:px-8">
        <span>© {new Date().getFullYear()} WhaleMo</span>
        <span className="text-right">On-chain research, not financial advice.</span>
      </div>
      {/* The wordmark, sized to the page width and cropped at the bottom edge. */}
      <div aria-hidden className="mt-6 -mb-[4vw] px-4 md:px-8">
        <BrandLogo className="h-auto w-full text-[#ffffff]" />
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <PageLayout pattern={false}>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pt-28 pb-16 text-center md:px-8">
          <div className="absolute inset-0">
            <SignalField />
          </div>
          {/* Fade the field out at the edges and behind the headline so the copy stays readable. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 55% 45% at 50% 55%, var(--color-whalemo-bg) 20%, transparent 75%), linear-gradient(to bottom, var(--color-whalemo-bg), transparent 22%, transparent 78%, var(--color-whalemo-bg))',
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <span className="inline-flex items-center gap-2 border border-whalemo-line bg-whalemo-bg/80 px-3 py-1.5 text-xs text-whalemo-muted">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-whalemo-teal opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-whalemo-teal" />
              </span>
              Tracking 1000+ top trading wallets on Solana, Robinhood Chain and BNB Chain
            </span>
            <h1 className="mx-auto mt-8 max-w-5xl text-[clamp(2.75rem,9vw,7.5rem)] leading-[0.95] font-semibold tracking-[-0.045em]">
              Follow the whales.
              <br />
              <span className="text-whalemo-teal">Skip the rugs.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-whalemo-muted md:text-lg md:leading-8">
              See what the most profitable traders on-chain are buying right now, and check any contract before you put a dollar in.
            </p>
            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <PrimaryCta />
              <a href="#product" className={lightButton}>
                See the product
              </a>
            </div>
            <p className="mt-5 text-xs text-whalemo-muted">Cancel anytime · Every feature included · No tiers</p>
          </motion.div>
        </section>

        {/* Product */}
        <section id="product" className="scroll-mt-24 px-4 pb-24 md:px-8 md:pb-32">
          <Rule className="mx-auto mb-16 max-w-7xl md:mb-24" />
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-16">
            <motion.div {...reveal}>
              <Label>Smart Wallets</Label>
              <h2 className="mt-5 text-4xl leading-[1.02] font-semibold tracking-[-0.035em] md:text-6xl">
                The tokens smart money is buying, ranked.
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-whalemo-muted md:text-lg">
                Every token the most profitable traders are net buying, ordered by how many of them are in. Updated every two hours.
              </p>
            </motion.div>
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }} className="relative p-3 sm:p-5">
              <Crosshairs className="text-whalemo-muted" />
              <div className="absolute inset-0 border border-dashed border-whalemo-line" aria-hidden />
              <div className="relative">
                <ProductWindow />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Product tour */}
        <section className="pb-24 md:pb-32">
          <div className="mx-auto mb-12 max-w-7xl px-4 md:px-8 lg:mb-0">
            <motion.div {...reveal} className="max-w-2xl">
              <Label>Everything in one place</Label>
              <h2 className="mt-5 text-4xl leading-[1.02] font-semibold tracking-[-0.035em] md:text-6xl">
                From signal to decision in one tab.
              </h2>
            </motion.div>
          </div>
          <StoryScroll />
        </section>

        {/* Before / after */}
        <section className="px-4 pb-24 md:px-8 md:pb-32">
          <Rule className="mx-auto mb-16 max-w-7xl md:mb-24" />
          <div className="mx-auto grid max-w-7xl gap-3 lg:grid-cols-2">
            <motion.div {...reveal} className="bg-whalemo-surface p-6 sm:p-10">
              <h3 className="text-3xl font-semibold tracking-[-0.03em] md:text-5xl">Trading blind</h3>
              <ul className="mt-10 space-y-2">
                {without.map((item) => (
                  <li key={item} className="flex items-start gap-4 bg-whalemo-bg px-5 py-4 text-sm text-whalemo-muted md:text-base">
                    <span className="mt-1.5 h-2 w-2 shrink-0 bg-whalemo-red/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }} className="flex flex-col bg-whalemo-surface p-6 sm:p-10">
              <h3 className="text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
                Trading with <span className="text-whalemo-teal">WhaleMo</span>
              </h3>
              <ul className="mt-10 space-y-2">
                {withWhaleMo.map((item) => (
                  <li key={item} className="flex items-start gap-4 bg-whalemo-bg px-5 py-4 text-sm md:text-base">
                    <span className="mt-1.5 h-2 w-2 shrink-0 bg-whalemo-teal" />
                    {item}
                  </li>
                ))}
              </ul>
              <SignupLink to={signupTo} className={cn(primaryButton, 'mt-8 w-full justify-between rounded-none px-5')}>
                {ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </SignupLink>
            </motion.div>
          </div>
        </section>

        {/* Stats band */}
        <section className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              className={cn('relative flex min-h-44 flex-col justify-between p-5 md:min-h-56 md:p-8', stat.tone)}
            >
              <span aria-hidden className="absolute top-4 right-4 h-1.5 w-1.5 bg-current opacity-80" />
              <span aria-hidden className="absolute right-4 bottom-4 h-1.5 w-1.5 bg-current opacity-80" />
              <span className="text-4xl font-light tracking-[-0.04em] sm:text-5xl md:text-7xl">{stat.value}</span>
              <span className="text-sm font-medium">{stat.label}</span>
            </motion.div>
          ))}
        </section>

        {/* Pricing */}
        {SUBSCRIPTIONS_ENABLED ? (
          <section id="pricing" className="scroll-mt-24 px-4 py-24 md:px-8 md:py-32">
            <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.6fr_1.4fr]">
              <motion.div {...reveal}>
                <Label>Pricing</Label>
              </motion.div>
              <div>
                <motion.h2 {...reveal} className="max-w-3xl text-4xl leading-[1.02] font-semibold tracking-[-0.035em] md:text-6xl">
                  One avoided rug pays for years of WhaleMo.
                </motion.h2>
                <motion.div
                  {...reveal}
                  transition={{ ...reveal.transition, delay: 0.1 }}
                  className="relative mt-12 grid border border-whalemo-line md:grid-cols-[0.9fr_1.1fr]"
                >
                  <div className="relative flex flex-col justify-between gap-10 bg-whalemo-accent p-8 text-whalemo-on-accent md:p-10">
                    <Crosshairs className="opacity-60" />
                    <div>
                      <div className="text-sm opacity-75">All access</div>
                      <div className="mt-3 flex items-end gap-2">
                        <span className="text-7xl font-light tracking-[-0.05em] md:text-8xl">${plan.price}</span>
                        <span className="mb-3 opacity-75">/month</span>
                      </div>
                      <p className="mt-3 text-sm opacity-75">Less than the fees on a few bad trades.</p>
                    </div>
                    <SignupLink to={signupTo} className={cn(buttonBase, 'w-full justify-between rounded-none bg-[#ffffff] px-5 text-whalemo-blue hover:opacity-90')}>
                      Subscribe now
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </SignupLink>
                  </div>
                  <ul className="divide-y divide-whalemo-line bg-whalemo-surface">
                    {[...plan.features, 'Cancel anytime from your billing page', 'Secure checkout with Stripe'].map((feature) => (
                      <li key={feature} className="flex items-center gap-4 px-6 py-4 text-sm md:px-8 md:text-base">
                        <span className="h-2 w-2 shrink-0 bg-whalemo-teal" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </div>
          </section>
        ) : null}

        {/* FAQ */}
        <section id="faq" className="scroll-mt-24 px-4 pb-24 md:px-8 md:pb-32">
          <Rule className="mx-auto mb-16 max-w-7xl md:mb-24" />
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.6fr_1.4fr]">
            <motion.div {...reveal}>
              <Label>FAQ</Label>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.035em] md:text-5xl">Questions, answered.</h2>
            </motion.div>
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
              <Faq />
            </motion.div>
          </div>
        </section>

        {/* Closing */}
        <section className="relative flex min-h-[80svh] flex-col items-center justify-center overflow-hidden px-4 py-24 text-center md:px-8">
          <div className="absolute inset-0">
            <RisingBars />
          </div>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, var(--color-whalemo-bg) 5%, transparent 55%)' }}
          />
          <motion.div {...reveal} className="relative">
            <Label>Your edge</Label>
            <h2 className="mx-auto mt-6 max-w-4xl text-[clamp(2.5rem,7vw,6rem)] leading-[0.98] font-semibold tracking-[-0.045em]">
              The whales already know. Now you do too.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base text-whalemo-muted md:text-lg">
              {SUBSCRIPTIONS_ENABLED
                ? `Every tool on every chain for $${plan.price}/month. Cancel anytime.`
                : 'Every tool on Solana, Robinhood Chain and BNB Chain.'}
            </p>
            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <PrimaryCta />
              <Link to="/login" className={lightButton}>
                Log in
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
      <LandingFooter />
    </PageLayout>
  )
}
