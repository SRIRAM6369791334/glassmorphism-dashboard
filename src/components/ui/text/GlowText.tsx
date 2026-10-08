import React from 'react'
import styles from './Text.module.css'
import type { TextTag } from './GradientText'

export interface GlowTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: TextTag
  children: React.ReactNode
  className?: string
  glowColor?: string
}

export const GlowText: React.FC<GlowTextProps> = ({
  as: Component = 'span',
  children,
  className = '',
  style,
  glowColor,
  ...props
}) => {
  const customStyle = glowColor
    ? {
        ...style,
        textShadow: `0 0 10px ${glowColor}80, 0 0 20px ${glowColor}50`,
      }
    : style

  return React.createElement(
    Component,
    {
      style: customStyle,
      className: `${styles.baseText} ${styles.glow} ${className}`.trim(),
      ...props,
    },
    children
  )
}

export default GlowText
