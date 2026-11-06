import { cn } from '@/lib/utils'

export const X_URL = 'https://x.com/whalemo_app'

/** The X (Twitter) logo. lucide no longer ships brand icons. */
function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  )
}

/** WhaleMo's X account, for the footers. */
export function XLink({ className, withHandle = false }: { className?: string; withHandle?: boolean }) {
  return (
    <a
      href={X_URL}
      target="_blank"
      rel="noopener noreferrer me"
      aria-label="WhaleMo on X (@whalemo_app)"
      title="Follow @whalemo_app on X"
      className={cn('inline-flex items-center gap-2 transition-opacity hover:opacity-70', className)}
    >
      <XLogo className="h-4 w-4" />
      {withHandle ? <span>@whalemo_app</span> : null}
    </a>
  )
}
