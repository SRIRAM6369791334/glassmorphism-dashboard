import React from 'react'
import styles from './Text.module.css'

export type TextTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'

export interface GradientTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: TextTag
  children: React.ReactNode
  className?: string
}

export const GradientText: React.FC<GradientTextProps> = ({
  as: Component = 'span',
  children,
  className = '',
  ...props
}) => {
  return React.createElement(
    Component,
    {
      className: `${styles.baseText} ${styles.gradient} ${className}`.trim(),
      ...props,
    },
    children
  )
}

export default GradientText
