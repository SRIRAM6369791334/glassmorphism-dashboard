import { useId, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Icon } from './Icon'
import styles from './Controls.module.css'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: 'user' | 'mail' | 'lock'
  trailing?: ReactNode
}

export function Field({ label, icon, trailing, id, ...props }: FieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <div className={styles.field}>
      <label className="sr-only" htmlFor={inputId}>{label}</label>
      <Icon name={icon} className={styles.fieldIcon} />
      <input id={inputId} placeholder={label} {...props} />
      {trailing}
    </div>
  )
}

export function PasswordField({ label = 'Password', ...props }: Omit<FieldProps, 'icon' | 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false)
  return (
    <Field {...props} label={label} icon="lock" type={visible ? 'text' : 'password'}
      trailing={
        <button className={styles.eye} type="button" aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible} onClick={() => setVisible(!visible)}>
          <Icon name={visible ? 'eye-off' : 'eye'} />
        </button>
      } />
  )
}
