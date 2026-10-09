import React from 'react'
import styles from './AnimatedText.module.css'

export type TextElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
export type AnimationVariant = 'gradient' | 'shimmer' | 'glow' | 'fadeIn' | 'none'

export interface AnimatedTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: TextElement
  variant?: AnimationVariant
  children: React.ReactNode
  className?: string
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  as: Component = 'span',
  variant = 'gradient',
  children,
  className = '',
  ...props
}) => {
  const variantClass = variant !== 'none' && styles[variant] ? styles[variant] : ''
  const combinedClassName = `${styles.animatedText} ${variantClass} ${className}`.trim()

  return React.createElement(
    Component,
    {
      className: combinedClassName,
      ...props,
    },
    children
  )
}

export default AnimatedText
