import React, { useEffect, useRef } from 'react'

export interface FluidCursorProps {
  color?: string
  radius?: number
  className?: string
}

export const FluidCursor: React.FC<FluidCursorProps> = ({
  color = '#06b6d4',
  radius = 24,
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

    let mouseX = -100
    let mouseY = -100
    let currentX = -100
    let currentY = -100
    let isMoving = false
    let idleTimeout: ReturnType<typeof setTimeout> | undefined

    const handlePointerMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      isMoving = true

      clearTimeout(idleTimeout)
      idleTimeout = setTimeout(() => {
        isMoving = false
      }, 100)

      if (!animationFrameId) {
        loop()
      }
    }

    const loop = () => {
      if (!running) return
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      const dx = mouseX - currentX
      const dy = mouseY - currentY
      currentX += dx * 0.18
      currentY += dy * 0.18

      if (currentX > -50 && currentY > -50) {
        const gradient = ctx.createRadialGradient(
          currentX,
          currentY,
          2,
          currentX,
          currentY,
          radius
        )
        gradient.addColorStop(0, color)
        gradient.addColorStop(0.4, `${color}66`)
        gradient.addColorStop(1, 'transparent')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(currentX, currentY, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      if (Math.hypot(dx, dy) > 0.5 || isMoving) {
        animationFrameId = requestAnimationFrame(loop)
      } else {
        animationFrameId = undefined
      }
    }

    window.addEventListener('mousemove', handlePointerMove, { passive: true })

    return () => {
      running = false
      clearTimeout(idleTimeout)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handlePointerMove)
    }
  }, [color, radius])

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

export default FluidCursor
