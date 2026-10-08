import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import type { AuthMode } from './types'
import styles from './AuthScreen.module.css'

export function WelcomePanel({ mode, onSwitch }: { mode: AuthMode; onSwitch: () => void }) {
  const isLogin = mode === 'login'
  return (
    <aside className={styles.welcome} aria-label={isLogin ? 'Create an account' : 'Welcome back'}>
      <div>
        <h2>{isLogin ? <>HELLO,<br />FRIEND!</> : <>WELCOME<br />BACK!</>}</h2>
        <p>{isLogin ? <>Enter your personal details<br />and start your journey<br />with us.</> : <>Already a Member? Please Login<br />with your credentials.</>}</p>
        <Button variant="secondary" onClick={onSwitch}>
          {isLogin ? 'Create Account' : 'Sign in'}<Icon name="arrow" />
        </Button>
      </div>
    </aside>
  )
}
