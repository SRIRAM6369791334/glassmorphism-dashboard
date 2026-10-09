import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface GlowingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  glowColor?: string
  hoverEffect?: boolean
}

export interface GlowingCardsProps {
  children: React.ReactNode
  className?: string
  /** Enable the glowing overlay effect */
  enableGlow?: boolean
  /** Size of the glow effect radius in rem units */
  glowRadius?: number
  /** Opacity of the glow effect */
  glowOpacity?: number
  /** Animation duration for glow transitions */
  animationDuration?: number
  /** Enable hover effects on individual cards */
  enableHover?: boolean
  /** Gap between cards */
  gap?: string
  /** Maximum width of cards container */
  maxWidth?: string
  /** Padding around the container */
  padding?: string
  /** Background color for the container */
  backgroundColor?: string
  /** Border radius for cards */
  borderRadius?: string
  /** Enable responsive layout */
  responsive?: boolean
  /** Custom CSS variables for theming */
  customTheme?: {
    cardBg?: string
    cardBorder?: string
    textColor?: string
    hoverBg?: string
  }
}

export const GlowingCard: React.FC<GlowingCardProps> = ({
  children,
  className,
  glowColor = '#3b82f6',
  hoverEffect = true,
  style,
  ...props
}) => {
  return (
    <div
      className={cn(
        'glowing-card',
        className
      )}
      data-hover-effect={hoverEffect}
      style={{
        position: 'relative',
        flex: '1 1 220px',
        minWidth: '14rem',
        padding: '1.5rem',
        borderRadius: 'var(--border-radius, 1rem)',
        backgroundColor: 'var(--card-bg, rgba(23, 23, 28, 0.65))',
        border: '1px solid var(--card-border, rgba(255, 255, 255, 0.1))',
        color: 'var(--color-primary, #ffffff)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transition: 'all var(--animation-duration, 400ms) cubic-bezier(0.16, 1, 0.3, 1)',
        '--glow-color': glowColor,
        ...style,
      } as React.CSSProperties}
      {...props}
    >
      {children}
    </div>
  )
}

export const GlowingCards: React.FC<GlowingCardsProps> = ({
  children,
  className,
  enableGlow = true,
  glowRadius = 25,
  glowOpacity = 1,
  animationDuration = 400,
  enableHover = true,
  gap = '2.5rem',
  maxWidth = '75rem',
  padding = '3rem 1.5rem',
  backgroundColor,
  borderRadius = '1rem',
  responsive = true,
  customTheme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [showOverlay, setShowOverlay] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    const overlay = overlayRef.current

    if (!container || !overlay || !enableGlow) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setShowOverlay(true)
      overlay.style.setProperty('--x', `${x}px`)
      overlay.style.setProperty('--y', `${y}px`)
      overlay.style.setProperty('--opacity', glowOpacity.toString())
    }

    const handleMouseLeave = () => {
      setShowOverlay(false)
      overlay.style.setProperty('--opacity', '0')
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [enableGlow, glowOpacity])

  const containerStyle = {
    '--gap': gap,
    '--max-width': maxWidth,
    '--padding': padding,
    '--border-radius': borderRadius,
    '--animation-duration': `${animationDuration}ms`,
    '--glow-radius': `${glowRadius}rem`,
    '--glow-opacity': glowOpacity,
    backgroundColor: backgroundColor || undefined,
    position: 'relative',
    width: '100%',
    ...customTheme,
  } as React.CSSProperties

  return (
    <div
      className={cn('glowing-cards-wrapper', className)}
      data-enable-hover={enableHover}
      style={containerStyle}
    >
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          maxWidth: 'var(--max-width, 75rem)',
          margin: '0 auto',
          padding: 'var(--padding, 3rem 1.5rem)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 'var(--gap, 2.5rem)',
            flexDirection: responsive ? 'row' : 'row',
          }}
        >
          {children}
        </div>

        {enableGlow && (
          <div
            ref={overlayRef}
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              userSelect: 'none',
              transition: `opacity var(--animation-duration, 400ms) ease-out`,
              WebkitMask:
                'radial-gradient(var(--glow-radius, 25rem) var(--glow-radius, 25rem) at var(--x, 0) var(--y, 0), #000 1%, transparent 50%)',
              mask:
                'radial-gradient(var(--glow-radius, 25rem) var(--glow-radius, 25rem) at var(--x, 0) var(--y, 0), #000 1%, transparent 50%)',
              opacity: showOverlay ? 'var(--opacity, 1)' : '0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 'var(--gap, 2.5rem)',
                maxWidth: 'var(--max-width, 75rem)',
                margin: '0 auto',
                padding: 'var(--padding, 3rem 1.5rem)',
              }}
            >
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child) && child.type === GlowingCard) {
                  const element = child as React.ReactElement<GlowingCardProps>
                  const cardGlowColor = element.props.glowColor || '#3b82f6'
                  return React.cloneElement(element, {
                    style: {
                      ...element.props.style,
                      backgroundColor: `${cardGlowColor}18`,
                      borderColor: cardGlowColor,
                      boxShadow: `0 0 25px ${cardGlowColor}40, 0 0 0 1px inset ${cardGlowColor}`,
                    },
                  })
                }
                return child
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GlowingCards