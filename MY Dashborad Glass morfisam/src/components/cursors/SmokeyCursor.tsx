import React, { useEffect, useRef } from 'react'

export interface SmokeyCursorProps {
  color?: string
  className?: string
}

interface SmokeMote {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  life: number
}

export const SmokeyCursor: React.FC<SmokeyCursorProps> = ({
  color = '#38bdf8',
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number | undefined
    let running = true

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const motes: SmokeMote[] = []
    let lastX = -1
    let lastY = -1

    const handlePointerMove = (e: MouseEvent) => {
      const x = e.clientX
      const y = e.clientY

      if (lastX >= 0 && lastY >= 0) {
        for (let i = 0; i < 2; i++) {
          motes.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -Math.random() * 0.9 - 0.2,
            radius: Math.random() * 12 + 8,
            opacity: 0.35,
            life: 45,
          })
        }
      }
      lastX = x
      lastY = y

      if (!animationFrameId) {
        loop()
      }
    }

    const loop = () => {
      if (!running) return
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i]
        m.life -= 1
        m.x += m.vx
        m.y += m.vy
        m.radius += 0.35
        m.opacity = (m.life / 45) * 0.35

        if (m.life <= 0) {
          motes.splice(i, 1)
          continue
        }

        const gradient = ctx.createRadialGradient(m.x, m.y, 1, m.x, m.y, m.radius)
        gradient.addColorStop(0, `${color}${Math.round(m.opacity * 255).toString(16).padStart(2, '0')}`)
        gradient.addColorStop(1, 'transparent')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2)
        ctx.fill()
      }

      if (motes.length > 0) {
        animationFrameId = requestAnimationFrame(loop)
      } else {
        animationFrameId = undefined
      }
    }

    window.addEventListener('mousemove', handlePointerMove, { passive: true })

    return () => {
      running = false
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handlePointerMove)
    }
  }, [color])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}

export default SmokeyCursor
