import { useState, useEffect } from 'react'
import { AuthScreen } from '../features/auth/AuthScreen'
import { CursorProvider } from '../context/CursorContext'
import { DesignPassExamples } from '../components/examples'

export function App() {
  const [view, setView] = useState<'auth' | 'examples'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      const search = window.location.search
      if (hash === '#examples' || search.includes('view=examples')) {
        return 'examples'
      }
    }
    return 'auth'
  })

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      const search = window.location.search
      if (hash === '#examples' || search.includes('view=examples')) {
        setView('examples')
      } else {
        setView('auth')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <CursorProvider defaultCursor="particles" defaultColor="#7526bf">
      {view === 'examples' ? (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top, #181124 0%, #09060f 100%)', padding: '2rem 1rem' }}>
          <div style={{ maxWidth: '840px', margin: '0 auto', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <a
              href="#"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#c084fc',
                textDecoration: 'none',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
              }}
            >
              ← Back to Auth Screen
            </a>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              DesignPass.dev Components Showcase
            </span>
          </div>
          <DesignPassExamples />
        </div>
      ) : (
        <>
          <AuthScreen />
          <a
            href="#examples"
            style={{
              position: 'fixed',
              bottom: '1.25rem',
              right: '1.25rem',
              zIndex: 9999,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#ffffff',
              textDecoration: 'none',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              background: 'rgba(168, 85, 247, 0.25)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            ✨ Components Showcase →
          </a>
        </>
      )}
    </CursorProvider>
  )
}

