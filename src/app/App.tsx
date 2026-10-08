import { AuthScreen } from '../features/auth/AuthScreen'
import { ParticlesCursor } from '@/components/lightswind-pro/particles-cursor'

export function App() {
  return (
    <>
      <ParticlesCursor particleCount={1000} color="#a855f7" />
      <AuthScreen />
    </>
  )
}
