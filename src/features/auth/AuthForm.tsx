import type { FormEvent, Ref } from 'react'
import { Button } from '../../components/ui/Button'
import { IsometricButton } from '@/components/ui/button/IsometricButton'
import { Field, PasswordField } from '../../components/ui/Field'
import type { AuthMode, AuthSubmitHandlers } from './types'
import styles from './AuthScreen.module.css'

interface AuthFormProps extends AuthSubmitHandlers {
  mode: AuthMode
  headingRef: Ref<HTMLHeadingElement>
  onSwitch: () => void
  onRecover: () => void
  notice: string
}

export function AuthForm({ mode, headingRef, onSwitch, onRecover, onLogin, onRegister, notice }: AuthFormProps) {
  const isLogin = mode === 'login'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const value = (key: string) => String(values.get(key) ?? '')
    if (isLogin) onLogin({ username: value('username'), password: value('password') })
    else onRegister({ fullName: value('fullName'), email: value('email'), password: value('password') })
  }

  return (
    <div className={styles.formColumn}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate aria-labelledby="auth-heading">
        <h1 id="auth-heading" ref={headingRef} tabIndex={-1}>{isLogin ? 'Login' : 'Create Account'}</h1>
        <div className={styles.fields}>
          {isLogin ? <Field label="Username" icon="user" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} /> : <>
            <Field label="Full Name" icon="user" name="fullName" autoComplete="name" />
            <Field label="Work Email" icon="mail" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} />
          </>}
          <PasswordField label={isLogin ? 'Password' : 'Create Password'} name="password" autoComplete={isLogin ? 'current-password' : 'new-password'} />
        </div>
        <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'center' }}>
          <IsometricButton
            type="submit"
            wrapperClassName="w-44 h-11"
            settings={{ glowColor: '#a855f7', textColor: '#ffffff' }}
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </IsometricButton>
        </div>
        <div className={styles.formFooter}>
          <p>{isLogin ? "Don't have an account?" : 'Already a Member?'}{' '}
            <Button variant="text" onClick={onSwitch}>{isLogin ? 'Sign Up' : 'Login'}</Button>
          </p>
          {isLogin && <Button variant="text" className={styles.recovery} onClick={onRecover}>Forgot Password?</Button>}
        </div>
        <Feedback message={notice} />
      </form>
    </div>
  )
}

function Feedback({ message }: { message: string }) {
  return <div className={styles.feedback} role="status" aria-live="polite" aria-atomic="true">{message}</div>
}
