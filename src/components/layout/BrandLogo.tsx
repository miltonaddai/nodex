import { cn } from '@/lib/utils'
import whalemoLogo from '@/assets/whalemo-logo.svg'
import whalemoIcon from '@/assets/whalemo-icon.svg'

/** Width / height of each SVG's viewBox, so a height class alone sizes the mark. */
const marks = {
  wordmark: { src: whalemoLogo, ratio: 3515 / 658 },
  icon: { src: whalemoIcon, ratio: 1243 / 658 },
}

/**
 * The WhaleMo whale (icon) or whale plus name (wordmark). Drawn as a mask filled with the current
 * text color, so the mark follows the theme: set the color with a text-* class and the size with h-*.
 */
export function BrandLogo({ variant = 'wordmark', className }: {
  variant?: keyof typeof marks
  className?: string
}) {
  const { src, ratio } = marks[variant]
  return (
    <span
      role="img"
      aria-label="WhaleMo"
      className={cn('inline-block shrink-0 bg-current', className)}
      style={{
        aspectRatio: ratio,
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  )
}
