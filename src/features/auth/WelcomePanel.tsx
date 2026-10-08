import { IsometricButton } from '@/components/ui/button/IsometricButton'
import type { AuthMode } from './types'
import styles from './AuthScreen.module.css'

export function WelcomePanel({ mode, onSwitch }: { mode: AuthMode; onSwitch: () => void }) {
  const isLogin = mode === 'login'
  return (
    <aside className={styles.welcome} aria-label={isLogin ? 'Create an account' : 'Welcome back'}>
      <div>
        <h2>{isLogin ? <>HELLO, FRIEND!</> : <>WELCOME BACK!</>}</h2>
        <p>{isLogin ? <>Enter your personal details and start your journey<br />with us.</> : <>Already a Member? Please Login with your credentials.</>}</p>
        <div style={{ marginTop: '20px', display: 'flex' }}>
          <IsometricButton
            wrapperClassName="w-44 h-11"
            settings={{ glowColor: '#a855f7', textColor: '#ffffff' }}
            onClick={onSwitch}
          >
            {isLogin ? 'Create Account' : 'Sign in'}
          </IsometricButton>
        </div>
      </div>
    </aside>
  )
}
