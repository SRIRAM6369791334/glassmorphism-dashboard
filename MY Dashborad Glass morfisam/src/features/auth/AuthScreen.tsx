import { useState, useRef, useEffect, useCallback } from 'react'
import { flushSync } from 'react-dom'
import type { CSSProperties, MouseEvent } from 'react'
import { AuthForm } from './AuthForm'
import { WelcomePanel } from './WelcomePanel'
import { RecoveryModal } from './RecoveryModal'
import { useAuthTransition } from './useAuthTransition'
import styles from './AuthScreen.module.css'
import { authApi, authErrorMessage, restoreSession } from './authApi'
import type { AuthUser } from './authApi'
import type { LoginValues, RegisterValues } from './types'
import { Button } from '../../components/ui/Button'
import { ShimmerText } from '@/components/ui/text/ShimmerText'

export function AuthScreen() {
  const { mode, phase, durations, switchMode, headingRef } = useAuthTransition()
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState<{ purpose: 'recovery' | 'signup'; email?: string } | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [busy, setBusy] = useState(false)
  const [restoring, setRestoring] = useState(true)
  const inFlight = useRef(false)
  const mounted = useRef(false)
  const cardRef = useRef<HTMLElement>(null)
  const recoveryOpenerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    mounted.current = true
    let active = true
    void restoreSession().then(result => {
      if (active) setUser(result?.user ?? null)
    }).catch(error => {
      if (active) setNotice(authErrorMessage(error))
    }).finally(() => { if (active) setRestoring(false) })
    return () => { active = false; mounted.current = false }
  }, [])

  async function perform(action: () => Promise<void>) {
    if (inFlight.current || restoring) return
    inFlight.current = true
    setBusy(true)
    setNotice('')
    try { await action() }
    catch (error) { if (mounted.current) setNotice(authErrorMessage(error)) }
    finally {
      inFlight.current = false
      if (mounted.current) setBusy(false)
    }
  }

  function handleLogin(values: LoginValues) {
    void perform(async () => {
      const result = await authApi.login(values)
      if (mounted.current) setUser(result.user)
    })
  }

  function handleRegister(values: RegisterValues) {
    void perform(async () => {
      await authApi.signup(values)
      if (mounted.current) setDialog({ purpose: 'signup', email: values.email.trim() })
    })
  }

  function handleLogout(all = false) {
    void perform(async () => {
      await authApi.logout(all)
      if (mounted.current) { setUser(null); setNotice('You have been signed out.') }
    })
  }

  const closeDialog = useCallback(() => {
    // Closing a native dialog must restore its trigger synchronously in
    // WebKit; an effect is too late once WebKit has moved focus to <body>.
    flushSync(() => setDialog(null))
    const opener = recoveryOpenerRef.current
    recoveryOpenerRef.current = null
    if (!opener?.isConnected) return
    try { opener.focus({ preventScroll: true }) }
    catch { opener.focus() }
  }, [])

  function finishVerification() {
    setDialog(null)
    setNotice('Email verified. You can now sign in.')
    switchMode('login')
  }

  function handleSwitch() {
    if (busy || restoring) return
    setNotice('')
    setDialog(null)
    switchMode(mode === 'login' ? 'register' : 'login')
  }

  function handleRecover(trigger: HTMLButtonElement) {
    setNotice('')
    recoveryOpenerRef.current = trigger
    setDialog({ purpose: 'recovery' })
  }

  function handleCardMouseMove(e: MouseEvent<HTMLElement>) {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    card.style.setProperty('--card-mouse-x', `${x}px`)
    card.style.setProperty('--card-mouse-y', `${y}px`)
    card.style.setProperty('--card-glow-opacity', '1')
  }

  function handleCardMouseLeave() {
    const card = cardRef.current
    if (!card) return
    card.style.setProperty('--card-glow-opacity', '0')
  }

  const style = {
    '--enter-duration': `${durations.enter}ms`,
    '--exit-duration': `${durations.exit}ms`,
  } as CSSProperties

  return (
    <main className={styles.screen}>
      <div className={styles.authHero}>
        <article
          ref={cardRef}
          className={styles.card}
          data-mode={mode}
          data-phase={phase}
          aria-labelledby="auth-heading"
          style={style}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
        >
          {/* Mouse follow specular border illumination */}
          <div className={styles.cardGlowBorder} aria-hidden="true" />
          {/* Subtle cursor proximity spot light */}
          <div className={styles.cardSpecularSpot} aria-hidden="true" />

          <div className={styles.frostedBackdrop} aria-hidden="true" />
          <div className={styles.glassLayer} aria-hidden="true">
            <div className={styles.welcomeGlass} />
            <svg className={styles.divider} aria-hidden="true">
              <line x1="47%" y1="0%" x2="53.5%" y2="100%" />
            </svg>
          </div>
          <div key={mode} className={styles.view} inert={phase !== 'idle'}>
            {user ? <>
              <div className={styles.formColumn}>
                <section className={styles.form} aria-labelledby="auth-heading" aria-busy={busy}>
                  <h1 id="auth-heading"><ShimmerText>Signed in</ShimmerText></h1>
                  <p className={styles.sessionEmail}>{user.displayName || user.email}</p>
                  <div className={styles.sessionActions}>
                    <Button onClick={() => handleLogout()} disabled={busy}>Sign out</Button>
                    <Button variant="text" onClick={() => handleLogout(true)} disabled={busy}>Sign out all devices</Button>
                  </div>
                  <div className={styles.feedback} role="status" aria-live="polite">{notice}</div>
                </section>
              </div>
              <aside className={styles.welcome}>
                <div><h2><ShimmerText>WELCOME BACK!</ShimmerText></h2><p>Your account is securely signed in.</p></div>
              </aside>
            </> : <><AuthForm
              mode={mode}
              headingRef={headingRef}
              onSwitch={handleSwitch}
              onLogin={handleLogin}
              onRegister={handleRegister}
              onRecover={handleRecover}
              notice={restoring ? 'Checking your session…' : notice}
              busy={busy || restoring}
            />
            <WelcomePanel mode={mode} onSwitch={handleSwitch} disabled={busy || restoring} /></>}
          </div>
        </article>
      </div>

      {dialog && <RecoveryModal
        purpose={dialog.purpose}
        initialEmail={dialog.email}
        onClose={closeDialog}
        onVerified={finishVerification}
      />}
    </main>
  )
}
