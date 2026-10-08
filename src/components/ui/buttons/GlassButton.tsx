import type { ButtonHTMLAttributes } from 'react'
import styles from './Buttons.module.css'

export type GlassButtonVariant = 'primary' | 'secondary' | 'text'

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant
}

export function GlassButton({
  variant = 'primary',
  type = 'button',
  className = '',
  children,
  ...props
}: GlassButtonProps) {
  const variantClass =
    variant === 'primary'
      ? styles.glassPrimary
      : variant === 'secondary'
      ? styles.glassSecondary
      : styles.glassText

  return (
    <button
      type={type}
      className={`${styles.baseButton} ${styles.glass} ${variantClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}

export default GlassButton
