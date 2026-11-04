import { Eye } from 'lucide-react'

/** Dims a table row's cells once its token has been opened, restoring them on hover. */
export const VIEWED_ROW = '[&>td]:opacity-70 hover:[&>td]:opacity-100 [&>td]:transition-opacity'

export function ViewedTokenIcon() {
  return (
    <span title="Already opened in Dexscreener" className="inline-flex shrink-0 text-whalemo-teal">
      <Eye className="h-3.5 w-3.5" aria-label="Viewed" />
    </span>
  )
}
