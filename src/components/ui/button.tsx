import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nodex-teal/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-nodex-teal text-nodex-bg hover:bg-nodex-teal/90 hover:shadow-[0_0_30px_rgba(77,230,201,0.4)] active:scale-[0.98]',
        outline:
          'border border-nodex-teal text-nodex-teal bg-transparent hover:bg-nodex-teal/10 hover:shadow-[0_0_20px_rgba(77,230,201,0.2)]',
        ghost: 'text-white hover:text-nodex-teal hover:bg-white/5',
        dark: 'bg-nodex-surface border border-white/10 text-white hover:border-nodex-teal/30',
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
