import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import styles from './Fields.module.css'

export interface FloatingFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function FloatingField({
  label,
  id,
  className = '',
  placeholder = ' ',
  ...props
}: FloatingFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={`${styles.floatingField} ${className}`.trim()}>
      <input id={inputId} placeholder={placeholder} {...props} />
      <label htmlFor={inputId}>{label}</label>
    </div>
  )
}

export default FloatingField
