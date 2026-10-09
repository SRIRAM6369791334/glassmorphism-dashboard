import { useId, useState } from 'react'
import type { FormEvent, InputHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from '../icons/Icon'
import { ShimmerText } from '../text/ShimmerText'
import styles from './Fields.module.css'

export type FieldVariant = 'box' | 'underline'

export interface GlassFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: IconName
  trailing?: ReactNode
  variant?: FieldVariant
  shimmer?: boolean
}

export function GlassField({
  label,
  icon,
  trailing,
  id,
  variant = 'box',
  className = '',
  defaultValue,
  value,
  onInput,
  onChange,
  shimmer = false,
  ...props
}: GlassFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const variantClass = variant === 'underline' ? styles.underline : styles.box

  const isControlled = value !== undefined
  const [internalFilled, setInternalFilled] = useState(
    Boolean(defaultValue || (isControlled && String(value).length > 0))
  )

  const isFilled = isControlled ? String(value).length > 0 : internalFilled

  function handleInputEvent(e: FormEvent<HTMLInputElement>) {
    if (!isControlled) {
      setInternalFilled(Boolean(e.currentTarget.value.length > 0))
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onInput?.(e as any)
  }

  function handleChangeEvent(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isControlled) {
      setInternalFilled(Boolean(e.currentTarget.value.length > 0))
    }
    onChange?.(e)
  }

  return (
    <div
      className={`${styles.field} ${variantClass} ${className}`.trim()}
      data-filled={isFilled ? 'true' : undefined}
    >
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      {icon && <Icon name={icon} className={styles.fieldIcon} />}
      <div className={styles.inputContainer}>
        <input
          id={inputId}
          placeholder={label}
          defaultValue={defaultValue}
          value={value}
          onInput={handleInputEvent}
          onChange={handleChangeEvent}
          className={shimmer ? styles.shimmerInput : undefined}
          {...props}
        />
        {shimmer && (
          <span className={styles.shimmerPlaceholder} aria-hidden="true">
            <ShimmerText>{label}</ShimmerText>
          </span>
        )}
      </div>
      {trailing}
    </div>
  )
}

export default GlassField
