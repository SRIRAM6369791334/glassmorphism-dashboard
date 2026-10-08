import type { ButtonHTMLAttributes } from 'react'
import styles from './Buttons.module.css'

export type ShimmerButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function ShimmerButton({
  type = 'button',
  className = '',
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      type={type}
      className={`${styles.baseButton} ${styles.shimmer} ${className}`.trim()}
      {...props}
    >
      <span className={styles.shimmerTrack} aria-hidden="true" />
      {children}
    </button>
  )
}

export default ShimmerButton
