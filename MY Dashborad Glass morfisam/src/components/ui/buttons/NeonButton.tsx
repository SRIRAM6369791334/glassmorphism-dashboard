import type { ButtonHTMLAttributes } from 'react'
import styles from './Buttons.module.css'

export interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  glowColor?: string
}

export function NeonButton({
  type = 'button',
  className = '',
  children,
  style,
  glowColor,
  ...props
}: NeonButtonProps) {
  const customStyle = glowColor
    ? {
        ...style,
        borderColor: glowColor,
        boxShadow: `0 0 16px ${glowColor}66, inset 0 0 10px ${glowColor}33`,
      }
    : style

  return (
    <button
      type={type}
      style={customStyle}
      className={`${styles.baseButton} ${styles.neon} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}

export default NeonButton
