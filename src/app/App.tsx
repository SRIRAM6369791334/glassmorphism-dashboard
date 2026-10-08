import { useState, useEffect } from 'react'
import { AuthScreen } from '../features/auth/AuthScreen'
import { CursorProvider } from '../context/CursorContext'
import { ComponentsGalleryPage } from '../pages/ComponentsGalleryPage'

function isGalleryRoute(): boolean {
  if (typeof window === 'undefined') return false
  const hash = window.location.hash.toLowerCase()
  const search = window.location.search.toLowerCase()
  return (
    hash.includes('components') ||
    hash.includes('gallery') ||
    hash.includes('showcase') ||
    hash.includes('examples') ||
    search.includes('view=components') ||
    search.includes('view=gallery') ||
    search.includes('view=examples')
  )
}

export function App() {
  const [view, setView] = useState<'auth' | 'components'>(() => {
    return isGalleryRoute() ? 'components' : 'auth'
  })

  useEffect(() => {
    const handleLocationChange = () => {
      setView(isGalleryRoute() ? 'components' : 'auth')
    }
    window.addEventListener('hashchange', handleLocationChange)
    window.addEventListener('popstate', handleLocationChange)
    return () => {
      window.removeEventListener('hashchange', handleLocationChange)
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  return (
    <CursorProvider defaultCursor="particles" defaultColor="#7526bf">
      {view === 'components' ? (
        <ComponentsGalleryPage />
      ) : (
        <>
          <AuthScreen />
          <a
            href="#/components"
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
              fontWeight: 500,
              padding: '0.5rem 1.15rem',
              borderRadius: '9999px',
              background: 'rgba(168, 85, 247, 0.28)',
              border: '1px solid rgba(168, 85, 247, 0.55)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>🎛️ Components Gallery (19) →</span>
          </a>
        </>
      )}
    </CursorProvider>
  )
}
