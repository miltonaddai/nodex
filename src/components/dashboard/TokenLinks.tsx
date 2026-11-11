import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy } from 'lucide-react'
import { TokenAvatar } from '@/components/dashboard/TokenAvatar'
import { tokenUrl } from '@/lib/chains'
import { cn } from '@/lib/utils'
import { markTokenViewed } from '@/lib/viewed-tokens'

interface App {
  id: string
  name: string
  note: string
  icon: string
  url: string
}

/**
 * Where a token can be opened. Pump.fun, Axiom and Jupiter only take Solana mints in these URLs, so other
 * chains get FOMO and Dexscreener. Icons live in public/apps.
 */
function appsFor(chain: string, contract: string): App[] {
  const apps: App[] = [
    { id: 'fomo', name: 'FOMO', note: 'Social trading', icon: '/apps/fomo.png', url: `https://fomo.family/tokens/${chain}/${contract}` },
  ]
  if (chain === 'solana') {
    apps.push(
      { id: 'pump', name: 'Pump.fun', note: 'Launchpad', icon: '/apps/pump.png', url: `https://pump.fun/coin/${contract}` },
      { id: 'axiom', name: 'Axiom', note: 'Trading terminal', icon: '/apps/axiom.png', url: `https://axiom.trade/token/${contract}` },
      { id: 'jupiter', name: 'Jupiter', note: 'Swap aggregator', icon: '/apps/jupiter.png', url: `https://jup.ag/tokens/${contract}` }
    )
  }
  apps.push({ id: 'dexscreener', name: 'Dexscreener', note: 'Charts and pairs', icon: '/apps/dexscreener.png', url: tokenUrl(chain, contract) })
  return apps
}

/* Geometry of the fan. The token sits at the left middle of the box; the apps lie on an arc
   around it, so the middle ones reach furthest out and the outer ones curve back (a ")" shape). */
const BOX_WIDTH = 330
const BOX_HEIGHT = 310
const TOKEN_X = 34
const TOKEN_Y = BOX_HEIGHT / 2
const RADIUS = 150
const ICON = 44
const EDGE = 8

/** Angles in degrees for n apps: wide enough to separate five, tighter for fewer. */
function arcAngles(count: number): number[] {
  const spread = count >= 5 ? 54 : count === 4 ? 48 : count === 3 ? 34 : 18
  if (count === 1) return [0]
  return Array.from({ length: count }, (_, i) => -spread + (2 * spread * i) / (count - 1))
}

/**
 * The contract address as a trigger. Clicking it fans out the apps the
 * token can be opened in, around the token's logo, over a lightly blurred page. Portalled to the body
 * so the tables' scroll containers can't clip it.
 */
export function TokenLinks({
  chain,
  contract,
  symbol,
  imageUrl,
  children,
  className,
}: {
  chain: string
  contract: string
  symbol: string
  imageUrl?: string
  children: ReactNode
  className?: string
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [origin, setOrigin] = useState<{ left: number; top: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const open = origin !== null

  // Puts the fan's token over the row's own logo, which sits just left of the address.
  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const tokenCenterX = rect.left - 30
    const left = Math.min(Math.max(tokenCenterX - TOKEN_X, EDGE), window.innerWidth - BOX_WIDTH - EDGE)
    const top = Math.min(
      Math.max(rect.top + rect.height / 2 - TOKEN_Y, EDGE),
      window.innerHeight - BOX_HEIGHT - EDGE
    )
    setOrigin({ left: Math.max(left, EDGE), top: Math.max(top, EDGE) })
  }, [])

  const close = useCallback(() => setOrigin(null), [])

  // Scrolling, resizing, Escape or a tap elsewhere closes it, so it never floats off its row.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (!boxRef.current?.contains(target) && !triggerRef.current?.contains(target)) close()
    }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open, close])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contract)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked; nothing to undo.
    }
  }

  const apps = appsFor(chain, contract)
  const angles = arcAngles(apps.length)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(event) => {
          // Rows expand on click; the address toggles its own fan instead.
          event.stopPropagation()
          if (open) close()
          else place()
        }}
        className={cn(
          'min-w-0 cursor-pointer truncate text-left text-xs text-whalemo-muted underline-offset-4 hover:text-whalemo-teal hover:underline',
          open && 'text-whalemo-teal underline',
          className
        )}
      >
        {children}
      </button>
      {createPortal(
        <AnimatePresence>
          {origin ? (
            <>
              <motion.div
                key="backdrop"
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-none fixed inset-0 z-[60] bg-whalemo-bg/55 backdrop-blur-[2px]"
              />
              <div
                key="fan"
                ref={boxRef}
                role="dialog"
                aria-label={`Open ${symbol} in`}
                onClick={(event) => event.stopPropagation()}
                style={{ left: origin.left, top: origin.top, width: BOX_WIDTH, height: BOX_HEIGHT }}
                className="fixed z-[61]"
              >
                {/* The token, with its copy button. */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  style={{ left: TOKEN_X - 24, top: TOKEN_Y - 24 }}
                  className="absolute"
                >
                  <TokenAvatar
                    imageUrl={imageUrl}
                    symbol={symbol}
                    fallbackClassName="bg-whalemo-accent"
                    className="h-12 w-12 text-base ring-2 ring-whalemo-teal/60"
                  />
                  <button
                    type="button"
                    onClick={() => void copy()}
                    title={copied ? 'Copied' : 'Copy contract address'}
                    aria-label={copied ? 'Contract address copied' : 'Copy contract address'}
                    className="absolute top-1/2 left-[56px] flex h-7 w-7 -translate-y-1/2 items-center justify-center border border-whalemo-line bg-whalemo-surface text-whalemo-muted transition-colors hover:border-whalemo-teal/60 hover:text-whalemo-teal"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-whalemo-green" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </motion.div>

                {/* The apps, fanned out on the arc. Each flies out from the token. */}
                {apps.map((app, index) => {
                  const angle = (angles[index] * Math.PI) / 180
                  const dx = RADIUS * Math.cos(angle)
                  const dy = RADIUS * Math.sin(angle)
                  return (
                    <motion.a
                      key={app.id}
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        markTokenViewed(chain, contract)
                        close()
                      }}
                      initial={{ opacity: 0, x: -dx, y: -dy, scale: 0.4 }}
                      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -dx * 0.6, y: -dy * 0.6, scale: 0.5 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 26, delay: 0.03 + index * 0.045 }}
                      style={{ left: TOKEN_X + dx - ICON / 2, top: TOKEN_Y + dy - ICON / 2 }}
                      className="group absolute flex items-center gap-3 pr-2"
                    >
                      <img
                        src={app.icon}
                        alt=""
                        width={ICON}
                        height={ICON}
                        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-whalemo-line transition-all duration-200 group-hover:scale-110 group-hover:ring-whalemo-teal"
                      />
                      <span className="whitespace-nowrap">
                        <span className="block text-sm font-semibold text-whalemo-foreground transition-colors group-hover:text-whalemo-teal">
                          {app.name}
                        </span>
                        <span className="block text-xs text-whalemo-muted">{app.note}</span>
                      </span>
                    </motion.a>
                  )
                })}
              </div>
            </>
          ) : null}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
