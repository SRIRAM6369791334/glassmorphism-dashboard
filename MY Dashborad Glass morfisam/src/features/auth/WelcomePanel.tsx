import { IsometricButton } from '@/components/ui/button/IsometricButton'
import { ShimmerText } from '@/components/ui/text/ShimmerText'
import type { AuthMode } from './types'
import styles from './AuthScreen.module.css'

export function WelcomePanel({ mode, onSwitch, disabled = false }: { mode: AuthMode; onSwitch: () => void; disabled?: boolean }) {
  const isLogin = mode === 'login'
  return (
    <aside className={styles.welcome} aria-label={isLogin ? 'Create an account' : 'Welcome back'}>
      <div>
        <h2>{isLogin ? <ShimmerText>HELLO, FRIEND!</ShimmerText> : <ShimmerText>WELCOME BACK!</ShimmerText>}</h2>
        <p>{isLogin ? <>Enter your personal details and start your journey<br />with us.</> : <>Already a Member? Please Login with your credentials.</>}</p>
        <div style={{ marginTop: '28px', display: 'flex' }}>
          <IsometricButton
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
            onClick={onSwitch}
            disabled={disabled}
          >
            {isLogin ? <ShimmerText>Create Account</ShimmerText> : 'Sign in'}
          </IsometricButton>
        </div>
      </div>
    </aside>
  )
}
