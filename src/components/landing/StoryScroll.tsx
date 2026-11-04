import { useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  AlertStep,
  Crosshairs,
  InsidersStep,
  ScannerStep,
  SmartWalletsStep,
  WatchlistStep,
} from '@/components/landing/visuals'

type Step = { label: string; title: string; body: string; visual: ReactNode }

const steps: Step[] = [
  {
    label: 'Smart Wallets',
    title: 'See what the best traders are buying. Right now.',
    body: 'Every token they are net buying, ranked by how many of them are in.',
    visual: <SmartWalletsStep />,
  },
  {
    label: 'Early signals',
    title: 'Hear it when they pile into a small cap.',
    body: 'A chime and an alert while it is still under $100K, not after the chart is vertical.',
    visual: <AlertStep />,
  },
  {
    label: 'Token scanner',
    title: 'Know what the contract can do to you.',
    body: 'Mint, freeze, raisable fees, liquidity and holder concentration, with a buy or avoid verdict.',
    visual: <ScannerStep />,
  },
  {
    label: 'Insider plays',
    title: 'Catch launches one person bought through many wallets.',
    body: 'Co-signed buys, shared funders and split bags, and whether the insiders still hold.',
    visual: <InsidersStep />,
  },
  {
    label: 'Watchlist',
    title: 'Track every token and wallet in one place.',
    body: 'Live price, market cap, 24h change and 7-day PnL for everything you follow.',
    visual: <WatchlistStep />,
  },
]

function Progress({ active }: { active: number }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#ffffff]/10 px-2 py-1.5">
      {steps.map((step, index) => (
        <span
          key={step.label}
          className={cn('h-1 transition-all duration-300', index === active ? 'w-8 bg-[#ffffff]' : 'w-1.5 bg-[#ffffff]/40')}
        />
      ))}
    </div>
  )
}

function VisualPanel({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex items-center justify-center border border-whalemo-line bg-whalemo-surface p-6 sm:p-10"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-whalemo-line) 1.5px, transparent 0)',
        backgroundSize: '36px 36px',
      }}
    >
      <div className="relative flex aspect-square w-full max-w-sm items-center justify-center border border-whalemo-line bg-whalemo-bg p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)]">
        {children}
      </div>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-whalemo-muted">
        Sample data
      </span>
    </div>
  )
}

/**
 * The product tour. On large screens the panel pins while the page scrolls and the statement
 * changes with each step; on smaller screens the steps simply stack.
 */
export function StoryScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    setActive(Math.min(steps.length - 1, Math.floor(progress * steps.length)))
  })
  const step = steps[active]

  return (
    <>
      {/* Pinned version */}
      <div ref={ref} className="relative hidden lg:block" style={{ height: `${steps.length * 90}vh` }}>
        <div className="sticky top-0 flex h-screen items-center px-8">
          <div className="mx-auto grid h-[min(78vh,640px)] w-full max-w-7xl grid-cols-2">
            <div className="relative flex flex-col items-center justify-center bg-whalemo-accent px-12 text-center text-[#ffffff]">
              <Crosshairs className="text-[#ffffff]/60" />
              <span className="absolute top-8 text-xs uppercase tracking-[0.2em] text-[#ffffff]/70">
                {String(active + 1).padStart(2, '0')} · {step.label}
              </span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <h3 className="mx-auto max-w-md text-4xl leading-[1.1] font-semibold tracking-[-0.02em] xl:text-5xl">{step.title}</h3>
                  <p className="mx-auto mt-5 max-w-sm text-base leading-7 text-[#ffffff]/75">{step.body}</p>
                </motion.div>
              </AnimatePresence>
              <div className="absolute bottom-8">
                <Progress active={active} />
              </div>
            </div>
            <VisualPanel>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="flex w-full items-center justify-center"
                >
                  {step.visual}
                </motion.div>
              </AnimatePresence>
            </VisualPanel>
          </div>
        </div>
      </div>

      {/* Stacked version */}
      <div className="space-y-6 px-4 md:px-8 lg:hidden">
        {steps.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="mx-auto grid max-w-3xl grid-cols-1"
          >
            <div className="relative bg-whalemo-accent px-6 py-10 text-[#ffffff] sm:px-10">
              <Crosshairs className="text-[#ffffff]/60" />
              <span className="text-xs uppercase tracking-[0.2em] text-[#ffffff]/70">
                {String(index + 1).padStart(2, '0')} · {item.label}
              </span>
              <h3 className="mt-3 text-2xl leading-tight font-semibold tracking-[-0.02em] sm:text-3xl">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#ffffff]/75 sm:text-base">{item.body}</p>
            </div>
            <VisualPanel>{item.visual}</VisualPanel>
          </motion.div>
        ))}
      </div>
    </>
  )
}
