import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ScanEye, ScanSearch, Users } from 'lucide-react'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { PublicFooter } from '@/components/layout/PublicFooter'

const highlights = [
  { icon: Users, text: 'See what 1000+ top trading wallets are buying' },
  { icon: ScanSearch, text: 'Scan any contract for rugs, fees and concentrated supply' },
  { icon: ScanEye, text: 'Catch launches bought by insiders through many wallets' },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
}

/**
 * The login and signup card: a colored brand panel beside the form. On phones the brand panel
 * shrinks to a colored header above the form.
 */
export function AuthShell({ title, subtitle, children, footer }: {
  title: string
  subtitle: ReactNode
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <>
      <main className="flex flex-1 items-center justify-center px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="grid w-full max-w-4xl overflow-hidden rounded-md border border-whalemo-line bg-whalemo-surface shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)] md:grid-cols-[0.95fr_1.05fr]"
        >
          {/* Brand panel */}
          <div className="relative overflow-hidden bg-gradient-to-br from-whalemo-accent via-[#33606a] to-whalemo-blue p-7 text-[#ffffff] md:p-10">
            <motion.div
              aria-hidden
              className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#ffffff]/10"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div aria-hidden className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-[#ffffff]/[0.06]" />
            <motion.div variants={container} initial="hidden" animate="show" className="relative flex h-full flex-col">
              <motion.span variants={item} className="mb-6 flex text-[#ffffff]">
                <BrandLogo className="h-8" />
              </motion.span>
              <motion.h2 variants={item} className="text-2xl font-bold leading-tight md:text-3xl">
                Find your edge on-chain.
              </motion.h2>
              <motion.p variants={item} className="mt-2 text-sm text-[#ffffff]/75">
                Solana, Robinhood Chain and BNB Chain, updated every 2 hours.
              </motion.p>
              <ul className="mt-8 hidden space-y-4 md:block">
                {highlights.map(({ icon: Icon, text }) => (
                  <motion.li key={text} variants={item} className="flex items-start gap-3 text-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[#ffffff]/15">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="pt-1.5 text-[#ffffff]/90">{text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Form */}
          <motion.div variants={container} initial="hidden" animate="show" className="p-7 md:p-10">
            <motion.h1 variants={item} className="mb-2 text-3xl font-bold">
              {title}
            </motion.h1>
            <motion.p variants={item} className="mb-8 text-sm text-whalemo-muted">
              {subtitle}
            </motion.p>
            <motion.div variants={item}>{children}</motion.div>
            <motion.p variants={item} className="mt-6 text-center text-sm text-whalemo-muted">
              {footer}
            </motion.p>
          </motion.div>
        </motion.div>
      </main>
      <PublicFooter />
    </>
  )
}
