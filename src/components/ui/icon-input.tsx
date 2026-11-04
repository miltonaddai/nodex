import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input, type InputProps } from '@/components/ui/input'

interface IconInputProps extends InputProps {
  icon: LucideIcon
}

const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  ({ icon: Icon, className, ...props }, ref) => {
    return (
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-whalemo-muted"
          aria-hidden
        />
        <Input ref={ref} className={cn('pl-10', className)} {...props} />
      </div>
    )
  }
)
IconInput.displayName = 'IconInput'

export { IconInput }
