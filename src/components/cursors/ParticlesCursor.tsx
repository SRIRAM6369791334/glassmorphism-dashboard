import React, { useEffect, useRef } from 'react'

export interface ParticlesCursorProps {
  /** Number of cursor particles */
  particleCount?: number
  /** Particle color (hex, rgb, or rgba) */
  color?: string
  /** Additional canvas CSS className */
  className?: string
  /** Maximum particle size in pixels */
  maxSize?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  maxLife: number
}

export const ParticlesCursor: React.FC<ParticlesCursorProps> = ({
  particleCount = 1000,
  color = '#a855f7',
  className,
  maxSize = 2.8,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number | undefined
    let running = true
    let isAnimating = false
    let isMoving = false
    let idleTimeout: ReturnType<typeof setTimeout> | undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    // Setup canvas size
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    // Pre-allocated pool of particles
    const poolSize = Math.max(100, Math.min(particleCount, 1500))
    const particles: Particle[] = new Array(poolSize)
    for (let i = 0; i < poolSize; i++) {
      particles[i] = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 0,
        alpha: 0,
        life: 0,
        maxLife: 1,
      }
    }
    let poolIndex = 0

    let lastX = -1
    let lastY = -1

    // Parse base color for rgba rendering
    const rgbMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    const baseR = rgbMatch ? parseInt(rgbMatch[1], 16) : 168
    const baseG = rgbMatch ? parseInt(rgbMatch[2], 16) : 85
    const baseB = rgbMatch ? parseInt(rgbMatch[3], 16) : 247

    const render = () => {
      if (!running) {
        isAnimating = false
        return
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      let activeParticles = 0
      for (let i = 0; i < poolSize; i++) {
        const p = particles[i]
        if (p.life <= 0) continue

        activeParticles++
        p.life -= 1
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.95
        p.vy *= 0.95
        p.alpha = Math.max(0, (p.life / p.maxLife) * 0.9)

        ctx.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      if (activeParticles > 0 || isMoving) {
        animationFrameId = requestAnimationFrame(render)
      } else {
        isAnimating = false
      }
    }

    const triggerRender = () => {
      if (!isAnimating && running) {
        isAnimating = true
        animationFrameId = requestAnimationFrame(render)
      }
    }

    const spawn = (x: number, y: number, count = 3) => {
      for (let i = 0; i < count; i++) {
        const p = particles[poolIndex]
        poolIndex = (poolIndex + 1) % poolSize

        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 1.6 + 0.4
        const maxLife = Math.random() * 16 + 10

        p.x = x + (Math.random() - 0.5) * 6
        p.y = y + (Math.random() - 0.5) * 6
        p.vx = Math.cos(angle) * speed
        p.vy = Math.sin(angle) * speed - 0.2
        p.size = Math.random() * maxSize + 1.2
        p.alpha = 0.95
        p.life = maxLife
        p.maxLife = maxLife
      }
    }

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0
      let clientY = 0

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else if ('clientX' in e) {
        clientX = e.clientX
        clientY = e.clientY
      }

      if (lastX >= 0 && lastY >= 0) {
        const dx = clientX - lastX
        const dy = clientY - lastY
        const dist = Math.hypot(dx, dy)
        const steps = Math.min(Math.floor(dist / 16), 3)
        for (let s = 1; s <= steps; s++) {
          const t = s / steps
          spawn(lastX + dx * t, lastY + dy * t, 2)
        }
      } else {
        spawn(clientX, clientY, 3)
      }

      lastX = clientX
      lastY = clientY
      isMoving = true

      triggerRender()

      clearTimeout(idleTimeout)
      idleTimeout = setTimeout(() => {
        isMoving = false
      }, 40)
    }

    window.addEventListener('mousemove', handlePointerMove, { passive: true })
    window.addEventListener('touchmove', handlePointerMove, { passive: true })

    return () => {
      running = false
      clearTimeout(idleTimeout)
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId)
      }
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('touchmove', handlePointerMove)
    }
  }, [particleCount, color, maxSize])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}

export default ParticlesCursor
