import React from 'react'
import styles from './Text.module.css'
import type { TextTag } from './GradientText'

export interface ShimmerTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: TextTag
  children: React.ReactNode
  className?: string
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({
  as: Component = 'span',
  children,
  className = '',
  ...props
}) => {
  return React.createElement(
    Component,
    {
      className: `${styles.baseText} ${styles.shimmer} ${className}`.trim(),
      ...props,
    },
    children
  )
}

export default ShimmerText
