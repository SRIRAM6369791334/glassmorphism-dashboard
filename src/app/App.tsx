import { AuthScreen } from '../features/auth/AuthScreen'
import { CursorProvider } from '../context/CursorContext'

export function App() {
  return (
    <CursorProvider defaultCursor="particles" defaultColor="#7526bf">
      <AuthScreen />
    </CursorProvider>
  )
}
