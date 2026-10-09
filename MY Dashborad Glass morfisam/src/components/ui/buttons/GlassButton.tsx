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
  const isText = variant === 'text'
  const variantClass = isText
    ? styles.glassText
    : `${styles.baseButton} ${styles.glass} ${variant === 'primary' ? styles.glassPrimary : styles.glassSecondary}`

  return (
    <button
      type={type}
      className={`${variantClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}

export default GlassButton
