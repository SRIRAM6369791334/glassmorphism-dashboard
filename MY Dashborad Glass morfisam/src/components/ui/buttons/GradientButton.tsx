import type { ButtonHTMLAttributes } from 'react'
import styles from './Buttons.module.css'

export type GradientButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function GradientButton({
  type = 'button',
  className = '',
  children,
  ...props
}: GradientButtonProps) {
  return (
    <button
      type={type}
      className={`${styles.baseButton} ${styles.gradient} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}

export default GradientButton
