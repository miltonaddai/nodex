import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { useToastStore, type ToastTone } from '@/stores/toastStore'
import { cn } from '@/lib/utils'

const TONES: Record<ToastTone, { icon: typeof Info; chip: string }> = {
  info: { icon: Info, chip: 'bg-nodex-teal/15 text-nodex-teal' },
  error: { icon: TriangleAlert, chip: 'bg-nodex-red/15 text-nodex-red' },
  success: { icon: CircleCheck, chip: 'bg-nodex-green/15 text-nodex-green' },
}

/** Renders toasts from the toast store. Mounted once at the app root. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
    >
      <AnimatePresence initial={false}>
        {toasts.map((item) => {
          const { icon: Icon, chip } = TONES[item.tone]
          return (
            <motion.div
              key={item.id}
              layout
              role="status"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-nodex-line bg-nodex-surface p-4 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.45)]"
            >
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', chip)}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description ? <p className="mt-0.5 text-sm text-nodex-muted">{item.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss"
                className="rounded-full p-1 text-nodex-muted transition-colors hover:bg-nodex-raised hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
