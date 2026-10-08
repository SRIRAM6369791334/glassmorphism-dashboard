import type { ButtonHTMLAttributes } from 'react'
import styles from './Controls.module.css'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'text'
}

export function Button({ variant = 'primary', type = 'button', className = '', ...props }: ButtonProps) {
  return <button type={type} className={`${styles.button} ${styles[variant]} ${className}`} {...props} />
}
