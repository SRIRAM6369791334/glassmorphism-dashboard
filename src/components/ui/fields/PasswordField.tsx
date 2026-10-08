import { useState } from 'react'
import { GlassField, type GlassFieldProps } from './GlassField'
import { Icon } from '../icons/Icon'
import styles from './Fields.module.css'

export type PasswordFieldProps = Omit<GlassFieldProps, 'icon' | 'type' | 'trailing'>

export function PasswordField({ label = 'Password', ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <GlassField
      {...props}
      label={label}
      icon="lock"
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          className={styles.eye}
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} />
        </button>
      }
    />
  )
}

export default PasswordField
