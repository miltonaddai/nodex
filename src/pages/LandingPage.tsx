import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BellRing, ChartNoAxesCombined, Check, ChevronDown, Search, ShieldCheck } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { GlassPanel } from '@/components/layout/GlassPanel'
import { LiquidGlass } from '@/components/layout/LiquidGlass'
import { SectionDivider } from '@/components/layout/SectionDivider'
import { Button } from '@/components/ui/button'

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Discover',
    description:
      'Scan millions of on-chain transactions to surface wallets with repeatable, risk-adjusted performance.',
  },
  {
    number: '02',
    icon: ChartNoAxesCombined,
    title: 'Analyze',
    description:
      'Compare realized P&L, win rate, trade history and consistency across Solana and Robinhood Chain.',
  },
  {
    number: '03',
    icon: BellRing,
    title: 'Track',
    description:
      'Build a focused watchlist and get notified when the wallets you follow make their next move.',
  },
]

const plans = [
  {
    name: 'Starter',
    price: '$29',
    description: 'The essentials for finding your edge.',
    features: ['Top wallet rankings', 'Token analytics', '10 tracked wallets', 'Daily data refresh'],
    featured: false,
  },
  {
    name: 'Pro',
    price: '$49',
    description: 'Deeper signals for serious on-chain traders.',
    features: ['Everything in Starter', 'Unlimited watchlists', 'Real-time wallet alerts', 'Advanced filters'],
    featured: true,
  },
]

const faqs = [
  {
    question: 'Which chains does NodeX support?',
    answer:
      'NodeX is built for Solana and Robinhood Chain, with wallet intelligence sourced through Helius, Alchemy and our ClickHouse analytics layer.',
  },
  {
    question: 'How do you rank profitable wallets?',
    answer:
      'Rankings combine realized profit, win rate, trade frequency, drawdown and consistency over the selected time period. A single lucky trade does not outweigh repeatable performance.',
  },
  {
    question: 'Is NodeX financial advice?',
    answer:
      'No. NodeX provides on-chain analytics and research tools. The data is informational and should be one input in your own independent decision-making.',
  },
  {
    question: 'Can I cancel my plan at any time?',
    answer:
      'Yes. Both plans are billed monthly with no long-term commitment, and you can cancel before your next renewal.',
  },
]

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.65, ease: 'easeOut' as const },
}

const sectionClass = 'relative flex min-h-screen items-center px-6 py-24 md:px-8'

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <PageLayout>
      <Navbar />
      <main>
        <section className="relative flex min-h-screen items-center px-4 py-24 pt-32 md:px-8">
          <div className="mx-auto w-full max-w-6xl px-6">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="max-w-2xl"
            >
            <motion.h1
              className="mb-6 text-6xl font-bold uppercase tracking-wider text-nodex-teal md:text-8xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Find Your Edge
            </motion.h1>
            <motion.p
              className="mb-12 max-w-xl text-xl uppercase tracking-widest text-white/80 md:text-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Profitable trading data at your finger tips
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Button asChild size="lg" className="h-16 px-12 text-lg tracking-widest">
                <Link to="/signup">Get Started</Link>
              </Button>
            </motion.div>
            </motion.div>
          </div>
        </section>

        <SectionDivider />

        <section id="how-it-works" className={sectionClass}>
          <div className="mx-auto w-full max-w-6xl">
          <motion.div {...reveal} className="mb-14 max-w-2xl">
            <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.3em] text-nodex-teal">
              From noise to signal
            </span>
            <h2 className="text-3xl font-bold md:text-5xl">How NodeX works</h2>
            <p className="mt-5 leading-7 text-white/55">
              A clear view of wallet performance, without the spreadsheets or endless block explorer tabs.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div key={step.title} {...reveal} transition={{ ...reveal.transition, delay: index * 0.1 }}>
                <GlassPanel
                  variant="frosted"
                  className="h-full rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_16px_48px_rgba(0,0,0,0.35)]"
                >
                  <div className="flex h-full min-h-80 flex-col p-8 md:p-9">
                    <div className="mb-14 flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-nodex-teal/25 bg-nodex-teal/10 text-nodex-teal">
                        <step.icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm tracking-[0.25em] text-white/30">{step.number}</span>
                    </div>
                    <h3 className="mb-4 text-2xl font-semibold">{step.title}</h3>
                    <p className="text-base leading-7 text-white/65">{step.description}</p>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
          </div>
        </section>

        <SectionDivider />

        <section id="pricing" className={sectionClass}>
          <div className="mx-auto w-full max-w-6xl">
          <motion.div {...reveal} className="mb-14 text-center">
            <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.3em] text-nodex-teal">
              Simple pricing
            </span>
            <h2 className="text-3xl font-bold md:text-5xl">Choose your edge</h2>
            <p className="mx-auto mt-5 max-w-xl text-white/55">
              Start with the data you need today. Upgrade when you are ready for real-time intelligence.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {plans.map((plan, index) => (
              <motion.div key={plan.name} {...reveal} transition={{ ...reveal.transition, delay: index * 0.1 }}>
                <LiquidGlass
                  interactive
                  variant="solid"
                  featured={plan.featured}
                  className="h-full rounded-3xl"
                >
                  <div className="flex h-full flex-col p-8 md:p-10">
                    <div className="mb-8 flex items-center justify-between">
                      <h3 className="text-xl font-semibold">NodeX {plan.name}</h3>
                      {plan.featured && (
                        <span className="rounded-full bg-nodex-teal px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-nodex-bg">
                          Most popular
                        </span>
                      )}
                    </div>
                    <div className="mb-3">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      <span className="text-white/35"> /month</span>
                    </div>
                    <p className="mb-8 text-sm text-white/50">{plan.description}</p>
                    <div className="mb-9 h-px bg-white/[0.07]" />
                    <ul className="mb-10 flex-1 space-y-4">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm text-white/70">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-nodex-teal/10 text-nodex-teal">
                            <Check className="h-3 w-3" />
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant={plan.featured ? 'default' : 'outline'} className="w-full">
                      <Link to={`/signup?plan=${plan.name.toLowerCase()}`}>Choose {plan.name}</Link>
                    </Button>
                  </div>
                </LiquidGlass>
              </motion.div>
            ))}
          </div>
          </div>
        </section>

        <SectionDivider />

        <section id="faq" className={sectionClass}>
          <div className="mx-auto w-full max-w-6xl">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            <motion.div {...reveal}>
              <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.3em] text-nodex-teal">
                FAQ
              </span>
              <h2 className="text-3xl font-bold md:text-5xl">Questions, answered.</h2>
              <div className="mt-8 flex items-center gap-3 text-sm text-white/45">
                <ShieldCheck className="h-5 w-5 text-nodex-teal" />
                Transparent data. No hidden methodology.
              </div>
            </motion.div>

            <motion.div {...reveal} className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {faqs.map((faq, index) => {
                const open = openFaq === index
                return (
                  <div key={faq.question}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : index)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left text-base font-medium transition-colors hover:text-nodex-teal"
                    >
                      {faq.question}
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-nodex-teal transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-2xl pb-6 text-sm leading-7 text-white/50">{faq.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </motion.div>
          </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] px-6 py-10 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="text-lg font-semibold tracking-wide text-white/80">
            NodeX
          </Link>
          <div className="flex flex-wrap gap-x-7 gap-y-3">
            <a href="#how-it-works" className="transition-colors hover:text-nodex-teal">How it works</a>
            <a href="#pricing" className="transition-colors hover:text-nodex-teal">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-nodex-teal">FAQ</a>
            <Link to="/login" className="transition-colors hover:text-nodex-teal">Login</Link>
          </div>
          <span>© {new Date().getFullYear()} NodeX</span>
        </div>
      </footer>
    </PageLayout>
  )
}
