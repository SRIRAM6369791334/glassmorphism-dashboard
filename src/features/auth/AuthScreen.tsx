import { useState, useRef } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { AuthForm } from './AuthForm'
import { WelcomePanel } from './WelcomePanel'
import { useAuthTransition } from './useAuthTransition'
import { GlowingCards, GlowingCard } from '@/components/lightswind/glowing-cards'
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

  const motionStyle = {
    '--exit-duration': `${durations.exit}ms`,
    '--enter-duration': `${durations.enter}ms`,
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
          style={motionStyle}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className={styles.cardGlowBorder} aria-hidden="true" />
          <div className={styles.cardSpecularSpot} aria-hidden="true" />
          <div className={styles.frostedBackdrop} aria-hidden="true" />
          <div key={`${mode}-glass`} className={styles.glassLayer} aria-hidden="true">
            <div className={styles.welcomeGlass} />
            <svg className={styles.divider} viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
              <line x1="47" y1="0" x2="53.5" y2="100" vectorEffect="non-scaling-stroke" />
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

      <section className={styles.showcaseSection} aria-label="Feature Highlights">
        <div className={styles.showcaseHeader}>
          <span className={styles.showcaseBadge}>LIGHTSWIND GLOW ENGINE</span>
          <h2 className={styles.showcaseTitle}>Interactive Glassmorphic Features</h2>
          <p className={styles.showcaseSubtitle}>
            Interactive card components with mouse-following glowing overlays and dynamic cursor particle physics.
          </p>
        </div>
        <GlowingCards
          enableGlow={true}
          glowRadius={22}
          glowOpacity={0.85}
          animationDuration={400}
          gap="1.5rem"
          maxWidth="900px"
          padding="1rem 0"
        >
          <GlowingCard glowColor="#a855f7">
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>⚡</span>
              <span className={styles.cardTag}>Physics</span>
            </div>
            <h3 className={styles.cardTitle}>Particles Cursor</h3>
            <p className={styles.cardDescription}>
              High-frequency particle trail with velocity momentum, particle recycling, and smooth life decay.
            </p>
          </GlowingCard>

          <GlowingCard glowColor="#38bdf8">
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>✨</span>
              <span className={styles.cardTag}>Specular</span>
            </div>
            <h3 className={styles.cardTitle}>Glowing Cards</h3>
            <p className={styles.cardDescription}>
              Masked radial gradient light follows mouse coordinates to reveal vibrant border illumination.
            </p>
          </GlowingCard>

          <GlowingCard glowColor="#10b981">
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>🛡️</span>
              <span className={styles.cardTag}>Security</span>
            </div>
            <h3 className={styles.cardTitle}>Frosted Glass Shell</h3>
            <p className={styles.cardDescription}>
              Multi-layered backdrop blur with non-scaling geometric accents and accessible focus transfer.
            </p>
          </GlowingCard>
        </GlowingCards>
      </section>
    </main>
  )
}
