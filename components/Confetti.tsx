'use client'

import { useEffect, useRef } from 'react'

const COLORS = ['#ff6ec4', '#7873f5', '#42d392', '#ffd84d', '#ff4444', '#36c5f0']

/**
 * Lightweight canvas confetti — no external dependency. Runs once for
 * `durationMs`, fading out over the final second, then clears itself.
 */
export function Confetti({ durationMs = 6000 }: { durationMs?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)
    const onResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    const count = Math.min(180, Math.max(80, Math.floor(w / 7)))
    const pieces = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * -h,
      size: 6 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      tilt: Math.random() * Math.PI,
      vy: 2 + Math.random() * 3.5,
      vx: -1.5 + Math.random() * 3,
      spin: -0.15 + Math.random() * 0.3,
    }))

    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, w, h)
      ctx.globalAlpha = Math.max(0, Math.min(1, (durationMs - elapsed) / 1000))

      for (const p of pieces) {
        p.y += p.vy
        p.x += p.vx
        p.tilt += p.spin
        if (p.y > h + 20) {
          p.y = -20
          p.x = Math.random() * w
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.tilt)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }

      ctx.globalAlpha = 1
      if (elapsed < durationMs) {
        raf = requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, w, h)
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [durationMs])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[60]" aria-hidden />
}
