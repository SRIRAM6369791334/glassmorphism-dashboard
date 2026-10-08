import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from '../icons/Icon'
import styles from './Fields.module.css'

export interface GlassFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: IconName
  trailing?: ReactNode
}

export function GlassField({
  label,
  icon,
  trailing,
  id,
  className = '',
  ...props
}: GlassFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={`${styles.field} ${className}`.trim()}>
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
