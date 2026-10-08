import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from '../icons/Icon'
import styles from './Fields.module.css'

export type FieldVariant = 'box' | 'underline'

export interface GlassFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: IconName
  trailing?: ReactNode
  variant?: FieldVariant
}

export function GlassField({
  label,
  icon,
  trailing,
  id,
  variant = 'box',
  className = '',
  ...props
}: GlassFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const variantClass = variant === 'underline' ? styles.underline : styles.box

  return (
    <div className={`${styles.field} ${variantClass} ${className}`.trim()}>
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      {icon && <Icon name={icon} className={styles.fieldIcon} />}
      <input id={inputId} placeholder={label} {...props} />
      {trailing}
    </div>
  )
}

export default GlassField
