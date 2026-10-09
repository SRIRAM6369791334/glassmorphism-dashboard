import type { FormEvent, Ref } from 'react'
import { Button } from '../../components/ui/Button'
import { IsometricButton } from '@/components/ui/button/IsometricButton'
import { ShimmerText } from '@/components/ui/text/ShimmerText'
import { Field, PasswordField } from '../../components/ui/Field'
import type { AuthMode, AuthSubmitHandlers } from './types'
import styles from './AuthScreen.module.css'

interface AuthFormProps extends AuthSubmitHandlers {
  mode: AuthMode
  headingRef: Ref<HTMLHeadingElement>
  onSwitch: () => void
  onRecover: (trigger: HTMLButtonElement) => void
  notice: string
  busy: boolean
}

export function AuthForm({ mode, headingRef, onSwitch, onRecover, onLogin, onRegister, notice, busy }: AuthFormProps) {
  const isLogin = mode === 'login'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const values = new FormData(event.currentTarget)
    const value = (key: string) => String(values.get(key) ?? '')
    if (isLogin) onLogin({ email: value('email').trim(), password: value('password') })
    else onRegister({ fullName: value('fullName'), email: value('email'), password: value('password') })
  }

  return (
    <div className={styles.formColumn}>
      <form className={styles.form} onSubmit={handleSubmit} aria-labelledby="auth-heading" aria-busy={busy}>
        <h1 id="auth-heading" ref={headingRef} tabIndex={-1}>
          {isLogin ? <ShimmerText>Login</ShimmerText> : <ShimmerText>Create Account</ShimmerText>}
        </h1>
        <div className={styles.fields}>
          {isLogin ? <Field label="Email" icon="mail" name="email" type="email" required maxLength={254} disabled={busy} autoComplete="username" autoCapitalize="none" spellCheck={false} /> : <>
            <Field label="Full Name" icon="user" name="fullName" autoComplete="name" required maxLength={200} disabled={busy} shimmer />
            <Field label="Work Email" icon="mail" name="email" type="email" required maxLength={254} disabled={busy} autoComplete="email" autoCapitalize="none" spellCheck={false} />
          </>}
          <PasswordField label={isLogin ? 'Password' : 'Create Password'} name="password" required minLength={isLogin ? undefined : 12} maxLength={128} disabled={busy} autoComplete={isLogin ? 'current-password' : 'new-password'} aria-describedby={isLogin ? undefined : 'password-guidance'} />
        </div>
        {!isLogin && <p id="password-guidance" className={styles.passwordGuidance}>Use 12–128 characters for your password.</p>}
        <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'center' }}>
          <IsometricButton
            type="submit"
            disabled={busy}
            wrapperClassName="w-48 h-12"
            settings={{
              glowColor: '#a855f7',
              textColor: '#ffffff',
              rotateX: '30deg',
              rotateZ: '0deg',
              standAngle: '0deg',
              thickness: '18px',
              gapRest: '12px',
              edgeColor: '#261c36',
            }}
          >
            {busy ? 'Please wait…' : isLogin ? <ShimmerText>Login</ShimmerText> : 'Sign Up'}
          </IsometricButton>
        </div>
        <div className={styles.formFooter}>
          <p>{isLogin ? "Don't have an account?" : 'Already a Member?'}{' '}
            <Button variant="text" onClick={onSwitch} disabled={busy}>{isLogin ? 'Sign Up' : 'Login'}</Button>
          </p>
          {isLogin && <Button variant="text" className={styles.recovery} onClick={event => onRecover(event.currentTarget)} disabled={busy}>Forgot Password?</Button>}
        </div>
        <Feedback message={notice} />
      </form>
    </div>
  )
}

function Feedback({ message }: { message: string }) {
  return <div className={styles.feedback} role="status" aria-live="polite" aria-atomic="true">{message}</div>
}
