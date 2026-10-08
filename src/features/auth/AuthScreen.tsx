import { useState, useRef } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { AuthForm } from './AuthForm'
import { WelcomePanel } from './WelcomePanel'
import { useAuthTransition } from './useAuthTransition'
import styles from './AuthScreen.module.css'

export function AuthScreen() {
  const { mode, phase, durations, switchMode, headingRef } = useAuthTransition()
  const [notice, setNotice] = useState('')
  const cardRef = useRef<HTMLElement>(null)

  function handleSwitch() {
    setNotice('')
    switchMode(mode === 'login' ? 'register' : 'login')
  }

  function showPreviewNotice() {
    setNotice('This is a UI preview. Authentication is not connected.')
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
            <AuthForm
              mode={mode}
              headingRef={headingRef}
              onSwitch={handleSwitch}
              onLogin={showPreviewNotice}
              onRegister={showPreviewNotice}
              onRecover={() => setNotice('Password recovery is not connected in this preview.')}
              notice={notice}
            />
            <WelcomePanel mode={mode} onSwitch={handleSwitch} />
          </div>
        </article>
      </div>
    </main>
  )
}
