import { useState, useRef, useEffect } from 'react'
import type { FormEvent, KeyboardEvent, ClipboardEvent, ReactNode } from 'react'
import { Field, PasswordField } from '../../components/ui/Field'
import { IsometricButton } from '@/components/ui/button/IsometricButton'
import { ShimmerText } from '@/components/ui/text/ShimmerText'
import { authApi, authErrorMessage } from './authApi'
import styles from './RecoveryModal.module.css'

export interface RecoveryModalProps {
  purpose?: 'recovery' | 'signup'
  initialEmail?: string
  onClose: () => void
  onVerified?: () => void
}

type Step = 'email' | 'otp' | 'new-password' | 'success'
const RESEND_INTERVAL = 60

// Keep the existing glass OTP/recovery presentation, with feature-owned API state.
export function RecoveryModal({ purpose = 'recovery', initialEmail = '', onClose, onVerified }: RecoveryModalProps) {
  const isSignup = purpose === 'signup'
  const [step, setStep] = useState<Step>(isSignup ? 'otp' : 'email')
  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(RESEND_INTERVAL)
  const [resendAt, setResendAt] = useState(() => Date.now() + RESEND_INTERVAL * 1000)
  const [devCode, setDevCode] = useState('')
  const [errorNotice, setErrorNotice] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const resetToken = useRef('')
  const inFlight = useRef(false)
  const mounted = useRef(false)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    mounted.current = true
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    restoreFocusRef.current = previousFocus
    return () => {
      mounted.current = false
      resetToken.current = ''
      // WebKit does not consistently restore focus when a modal dialog is
      // removed in the same React commit. A microtask runs after the dialog
      // closes while the opener is still connected.
      queueMicrotask(() => {
        if (!previousFocus?.isConnected) return
        try { previousFocus.focus({ preventScroll: true }) }
        catch { previousFocus.focus() }
      })
    }
  }, [])

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [step])

  useEffect(() => {
    if (step !== 'otp') return
    const timer = window.setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [step, resendAt])

  useEffect(() => {
    if (!import.meta.env.DEV || step !== 'otp' || !email) return
    let active = true
    const checkDevMail = async () => {
      try {
        const res = await fetch('/dev-mail')
        if (!res.ok) return
        const messages = (await res.json()) as { to?: string; code?: string; receivedAt?: number }[]
        if (Array.isArray(messages) && active) {
          const match = messages.find(m =>
            m.to?.toLowerCase() === email.toLowerCase().trim() && Date.now() - (m.receivedAt ?? 0) < 600000
          )
          if (match?.code) setDevCode(match.code)
        }
      } catch {
        // Dev mail not running or unavailable
      }
    }
    void checkDevMail()
    const interval = window.setInterval(checkDevMail, 2000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [step, email])

  async function perform(action: () => Promise<void>) {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setErrorNotice('')
    setNotice('')
    try { await action() }
    catch (error) { if (mounted.current) setErrorNotice(authErrorMessage(error)) }
    finally {
      inFlight.current = false
      if (mounted.current) setBusy(false)
    }
  }

  function restartCountdown() {
    setCountdown(RESEND_INTERVAL)
    setResendAt(Date.now() + RESEND_INTERVAL * 1000)
  }

  function closeDialog() {
    const opener = restoreFocusRef.current
    if (opener?.isConnected) {
      try { opener.focus({ preventScroll: true }) }
      catch { opener.focus() }
    }
    onClose()
  }

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = String(new FormData(event.currentTarget).get('recoveryEmail') ?? '').trim()
    void perform(async () => {
      await authApi.forgotPassword(value)
      if (!mounted.current) return
      setEmail(value)
      restartCountdown()
      setStep('otp')
    })
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    setOtp(previous => previous.map((item, position) => position === index ? digit : item))
    setErrorNotice('')
    if (digit && index < 5) otpInputRefs.current[index + 1]?.focus()
  }

  function handleOtpKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !otp[index] && index > 0) otpInputRefs.current[index - 1]?.focus()
  }

  function handleOtpPaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    setOtp(Array.from({ length: 6 }, (_, index) => pasted[index] ?? ''))
    setErrorNotice('')
    otpInputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) {
      setErrorNotice('Please enter all 6 digits of the verification code.')
      return
    }
    void perform(async () => {
      if (isSignup) {
        await authApi.verifyEmail(email, code)
        if (mounted.current) { setOtp(['', '', '', '', '', '']); setStep('success') }
      } else {
        const result = await authApi.verifyResetOtp(email, code)
        if (mounted.current) {
          resetToken.current = result.resetToken
          setOtp(['', '', '', '', '', ''])
          setStep('new-password')
        }
      }
    })
  }

  function handleResendOtp() {
    if (countdown > 0) return
    void perform(async () => {
      if (isSignup) await authApi.resendVerification(email)
      else await authApi.forgotPassword(email)
      if (!mounted.current) return
      setOtp(['', '', '', '', '', ''])
      restartCountdown()
      setNotice('If your account is eligible, a new verification code has been sent.')
      otpInputRefs.current[0]?.focus()
    })
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const password = String(values.get('newPassword') ?? '')
    const confirmation = String(values.get('confirmPassword') ?? '')
    if (password.length < 12 || password.length > 128) {
      setErrorNotice('Password must contain 12–128 characters.')
      return
    }
    if (password !== confirmation) {
      setErrorNotice('Passwords do not match.')
      return
    }
    void perform(async () => {
      await authApi.resetPassword(resetToken.current, password)
      if (!mounted.current) return
      resetToken.current = ''
      setStep('success')
    })
  }

  const feedback = <div role="status" aria-live="polite" aria-atomic="true" className={errorNotice ? styles.errorNotice : styles.notice}>{errorNotice || notice}</div>

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      className={styles.backdrop}
      aria-labelledby="recovery-modal-title"
      aria-describedby="recovery-modal-description"
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault()
          closeDialog()
          return
        }
        if (event.key !== 'Tab') return
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]'))
          .filter(element => element.getClientRects().length > 0)
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && (document.activeElement === first || document.activeElement === headingRef.current)) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      onClick={event => { if (event.target === event.currentTarget) closeDialog() }}
    >
      <div className={styles.modal}>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label={isSignup ? 'Close verification dialog' : 'Close recovery dialog'}>×</button>

        {step === 'email' && <>
          <div className={styles.stepBadge}>Step 1 of 3 · Email Verification</div>
          <h2 id="recovery-modal-title" ref={headingRef} tabIndex={-1} className={styles.modalTitle}><ShimmerText>Forgot Password?</ShimmerText></h2>
          <p id="recovery-modal-description" className={styles.modalSubtitle}>Enter your registered email address to receive a 6-digit one-time OTP code.</p>
          <form className={styles.form} onSubmit={handleEmailSubmit} aria-busy={busy}>
            <Field label="Registered Email" icon="mail" name="recoveryEmail" type="email" defaultValue={email} required maxLength={254} disabled={busy} autoComplete="email" autoCapitalize="none" spellCheck={false} />
            {feedback}
            <ModalAction busy={busy}>Send OTP Code</ModalAction>
            <div><button type="button" className={styles.backButton} onClick={onClose}>← Back to Login</button></div>
          </form>
        </>}

        {step === 'otp' && <>
          <div className={styles.stepBadge}>{isSignup ? 'Verify your account' : 'Step 2 of 3 · Verify OTP'}</div>
          <h2 id="recovery-modal-title" ref={headingRef} tabIndex={-1} className={styles.modalTitle}><ShimmerText>Enter Email OTP</ShimmerText></h2>
          <p id="recovery-modal-description" className={styles.modalSubtitle}>If your account is eligible, a 6-digit code has been sent to <span className={styles.highlightEmail}>{email}</span>.</p>
          <form className={styles.form} onSubmit={handleOtpSubmit} aria-busy={busy} noValidate>
            <div className={styles.otpContainer} onPaste={handleOtpPaste}>
              {otp.map((digit, index) => <input key={index} ref={element => { otpInputRefs.current[index] = element }} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1} autoComplete={index === 0 ? 'one-time-code' : 'off'} value={digit} disabled={busy} data-filled={digit !== ''} aria-label={`Digit ${index + 1}`} className={styles.otpBox} onChange={event => handleOtpChange(index, event.target.value)} onKeyDown={event => handleOtpKeyDown(index, event)} />)}
            </div>
            {devCode && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0 2px' }}>
                <button
                  type="button"
                  className={styles.devCodeBadge}
                  onClick={() => {
                    setOtp(devCode.split('').slice(0, 6))
                    setErrorNotice('')
                  }}
                  title="Click to auto-fill code"
                >
                  <span>🔑 Code received: <strong>{devCode}</strong></span>
                  <span className={styles.devCodeAction}>(Click to fill)</span>
                </button>
              </div>
            )}
            <div className={styles.resendWrapper}>{countdown > 0 ? <span>Resend code in {countdown}s</span> : <button type="button" className={styles.resendButton} disabled={busy} onClick={handleResendOtp}>Resend OTP Code</button>}</div>
            {feedback}
            <ModalAction busy={busy}>Verify Code</ModalAction>
            <div><button type="button" className={styles.backButton} disabled={busy} onClick={() => {
              if (isSignup) onClose()
              else { setStep('email'); setOtp(['', '', '', '', '', '']); setErrorNotice(''); setNotice('') }
            }}>{isSignup ? 'Back to Sign Up' : '← Change Email Address'}</button></div>
          </form>
        </>}

        {step === 'new-password' && <>
          <div className={styles.verifiedBanner} aria-label="OTP verification status">
            <span className={styles.verifiedCheck}>✓</span>
            <span>OTP Code Verified Successfully!</span>
          </div>
          <div className={styles.stepBadge}>Step 3 of 3 · Reset Password</div>
          <h2 id="recovery-modal-title" ref={headingRef} tabIndex={-1} className={styles.modalTitle}><ShimmerText>Set New Password</ShimmerText></h2>
          <p id="recovery-modal-description" className={styles.modalSubtitle}>Email verified! Choose a password with 12–128 characters.</p>
          <form className={styles.form} onSubmit={handlePasswordSubmit} aria-busy={busy}>
            <PasswordField label="New Password" name="newPassword" autoComplete="new-password" required minLength={12} maxLength={128} disabled={busy} />
            <PasswordField label="Confirm Password" name="confirmPassword" autoComplete="new-password" required minLength={12} maxLength={128} disabled={busy} />
            {feedback}
            <ModalAction busy={busy}>Update Password</ModalAction>
            <div><button type="button" className={styles.backButton} onClick={onClose}>Cancel</button></div>
          </form>
        </>}

        {step === 'success' && <div className={styles.successContainer}>
          <div className={styles.successIcon} aria-hidden="true">✓</div>
          <h2 id="recovery-modal-title" ref={headingRef} tabIndex={-1} className={styles.successTitle}>{isSignup ? 'Email Verified!' : 'Password Updated!'}</h2>
          <p id="recovery-modal-description" className={styles.successDescription}>{isSignup ? 'Your email has been verified. You can now sign in to your account.' : 'Your account password has been reset successfully. You can now login with your new credentials.'}</p>
          <ModalAction onClick={isSignup ? onVerified ?? onClose : onClose}>Back to Login</ModalAction>
        </div>}
      </div>
    </div>
  )
}

function ModalAction({ children, busy = false, onClick }: { children: ReactNode; busy?: boolean; onClick?: () => void }) {
  return <div className={styles.submitWrapper}>
    <IsometricButton type={onClick ? 'button' : 'submit'} disabled={busy} onClick={onClick} wrapperClassName="w-52 h-12" settings={{ glowColor: '#a855f7', textColor: '#ffffff', rotateX: '30deg', rotateZ: '0deg', standAngle: '0deg', thickness: '18px', gapRest: '12px', edgeColor: '#261c36' }}>
      <ShimmerText>{busy ? 'Please wait…' : children}</ShimmerText>
    </IsometricButton>
  </div>
}
