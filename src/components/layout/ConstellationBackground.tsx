import { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  pulse: number
}

export function ConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let nodes: Node[] = []
    let mouse = { x: -1000, y: -1000 }
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.max(24, Math.min(52, Math.floor((window.innerWidth * window.innerHeight) / 28000)))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        radius: Math.random() * 1.5 + 1.8,
        pulse: Math.random() * Math.PI * 2,
      }))
    }

    const onPointerMove = (event: PointerEvent) => {
      mouse = { x: event.clientX, y: event.clientY }
    }

    const draw = (time: number) => {
      const width = window.innerWidth
      const height = window.innerHeight
      ctx.clearRect(0, 0, width, height)

      nodes.forEach((node) => {
        node.x += node.vx
        node.y += node.vy
        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1

        const mouseDistance = Math.hypot(node.x - mouse.x, node.y - mouse.y)
        if (mouseDistance < 150 && mouseDistance > 0) {
          node.x += ((node.x - mouse.x) / mouseDistance) * 0.18
          node.y += ((node.y - mouse.y) / mouseDistance) * 0.18
        }
      })

      const maxDist = Math.min(270, width * 0.24)
      for (let i = 0; i < nodes.length; i++) {
        const nearest = nodes
          .map((node, index) => ({ node, index, distance: Math.hypot(nodes[i].x - node.x, nodes[i].y - node.y) }))
          .filter(({ index, distance }) => index > i && distance < maxDist)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 2)

        nearest.forEach(({ node, distance }) => {
          const alpha = 0.16 + (1 - distance / maxDist) * 0.22
          ctx.beginPath()
          ctx.moveTo(nodes[i].x, nodes[i].y)
          ctx.lineTo(node.x, node.y)
          ctx.strokeStyle = `rgba(77, 230, 201, ${alpha})`
          ctx.lineWidth = 1
          ctx.stroke()
        })
      }

      nodes.forEach((node) => {
        const glow = 0.85 + Math.sin(time * 0.0015 + node.pulse) * 0.15
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(77, 230, 201, ${glow})`
        ctx.shadowColor = 'rgba(77, 230, 201, 0.95)'
        ctx.shadowBlur = 11 + glow * 9
        ctx.fill()
        ctx.shadowBlur = 0
      })

      animationId = requestAnimationFrame(draw)
    }

    resize()
    animationId = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove)
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden
    />
  )
}
