import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type Palette = { line: string; accent: string }

/** Reads the theme tokens, so the canvases follow light and dark mode. */
function readPalette(): Palette {
  const styles = getComputedStyle(document.documentElement)
  return {
    line: styles.getPropertyValue('--color-whalemo-foreground').trim() || '#eef3f7',
    accent: styles.getPropertyValue('--color-whalemo-teal').trim() || '#8dc2c5',
  }
}

/**
 * Runs `draw` on a canvas sized to its box at device pixel ratio. It pauses while off screen,
 * redraws on theme changes, and draws one still frame for people who prefer reduced motion.
 */
function useCanvasLoop(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, palette: Palette) => void) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let palette = readPalette()
    let width = 0
    let height = 0
    let frame = 0
    let visible = true

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height)
      draw(ctx, width, height, time, palette)
    }
    const loop = (time: number) => {
      render(time)
      if (visible && !reduced) frame = requestAnimationFrame(loop)
    }
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      render(performance.now())
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      cancelAnimationFrame(frame)
      if (visible && !reduced) frame = requestAnimationFrame(loop)
    })
    visibility.observe(canvas)
    const themeObserver = new MutationObserver(() => {
      palette = readPalette()
      render(performance.now())
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    resize()
    if (!reduced) frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibility.disconnect()
      themeObserver.disconnect()
    }
  }, [draw])

  return ref
}

/** Deterministic per-column randomness, so the field looks the same on every load. */
function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453
  return x - Math.floor(x)
}

function drawField(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, palette: Palette) {
  const gap = w < 640 ? 14 : 18
  const columns = Math.ceil(w / gap)
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  for (let i = 0; i < columns; i++) {
    const x = i * gap + gap / 2
    // Most columns are market noise; a few teal ones are the whales moving through it.
    const whale = hash(i) > 0.94
    for (let k = 0; k < 2; k++) {
      const seed = hash(i * 3.1 + k * 17.7)
      const length = 50 + seed * 90
      const speed = 0.02 + hash(i + k * 9.3) * 0.05
      const y = ((t * speed + seed * (h + length) * 3) % (h + length)) - length
      // A slow travelling wave across the columns makes the field read as one curved surface.
      const wave = (Math.sin(i * 0.16 + t * 0.00045 + y * 0.004) + 1) / 2
      const alpha = whale ? 0.85 : 0.05 + wave * wave * 0.4
      ctx.strokeStyle = whale ? palette.accent : palette.line
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + length)
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

/** Hero backdrop: falling line segments, with the occasional teal "whale" column. */
export function SignalField({ className }: { className?: string }) {
  const ref = useCanvasLoop(drawField)
  return <canvas ref={ref} aria-hidden className={cn('pointer-events-none block h-full w-full', className)} />
}

function drawBars(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, palette: Palette) {
  const gap = w < 640 ? 9 : 12
  const columns = Math.ceil(w / gap)
  for (let i = 0; i < columns; i++) {
    const x = i * gap
    const noise =
      (Math.sin(i * 0.19 + t * 0.0007) + Math.sin(i * 0.053 - t * 0.0004) + Math.sin(i * 0.71 + t * 0.0011) * 0.4 + 2.4) / 4.8
    const barHeight = h * (0.08 + noise * noise * 0.85)
    const strong = hash(i * 1.7) > 0.9
    const gradient = ctx.createLinearGradient(0, h, 0, h - barHeight)
    gradient.addColorStop(0, palette.accent)
    gradient.addColorStop(1, 'transparent')
    ctx.globalAlpha = strong ? 0.75 : 0.28
    ctx.fillStyle = gradient
    ctx.fillRect(x, h - barHeight, Math.max(2, gap * 0.35), barHeight)
  }
  ctx.globalAlpha = 1
}

/** Closing-section backdrop: rising teal bars, like volume building into a move. */
export function RisingBars({ className }: { className?: string }) {
  const ref = useCanvasLoop(drawBars)
  return <canvas ref={ref} aria-hidden className={cn('pointer-events-none block h-full w-full', className)} />
}
