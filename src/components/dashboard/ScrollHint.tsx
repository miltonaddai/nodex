import { ArrowRight } from 'lucide-react'

/** Phones only: wide tables scroll sideways, and nothing else tells you there is more to the right. */
export function ScrollHint() {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-xs text-whalemo-muted md:hidden">
      Swipe the table sideways for more columns
      <ArrowRight className="h-3.5 w-3.5" />
    </p>
  )
}
