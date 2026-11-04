import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whalemo-teal/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-whalemo-accent text-whalemo-on-accent hover:bg-whalemo-accent/90 active:scale-[0.98]',
        outline:
          'border border-whalemo-teal text-whalemo-teal bg-transparent hover:bg-whalemo-teal/10',
        ghost: 'text-white hover:text-whalemo-teal hover:bg-white/5',
        dark: 'bg-whalemo-surface border border-whalemo-line text-white hover:border-whalemo-teal/40',
      },
      size: {
        default: 'h-11 px-8 text-sm tracking-wider uppercase',
        sm: 'h-9 px-5 text-xs tracking-wider uppercase',
        lg: 'h-14 px-10 text-base tracking-widest uppercase',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
