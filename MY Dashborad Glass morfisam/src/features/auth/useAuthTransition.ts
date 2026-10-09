import { useEffect, useRef, useState } from 'react'
import type { AuthMode } from './types'

type Phase = 'idle' | 'exiting' | 'entering'

export function useAuthTransition() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [phase, setPhase] = useState<Phase>('idle')
  const [durations, setDurations] = useState({ exit: 200, enter: 400 })
  const headingRef = useRef<HTMLHeadingElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const switching = useRef(false)
  const didSwitch = useRef(false)

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    // Hand focus over once the incoming view is interactive. Repeated pointer
    // events during the animation must not steal focus from the settled form.
    if (phase === 'idle' && didSwitch.current) headingRef.current?.focus({ preventScroll: true })
  }, [mode, phase])

  function switchMode(next: AuthMode) {
    // Ignore repeated activation while the same transition is in progress.
    if (switching.current || next === mode) return
    didSwitch.current = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setMode(next)
      return
    }
    const mobile = window.matchMedia('(max-width: 767px)').matches
    const timing = mobile ? { exit: 100, enter: 150 } : { exit: 200, enter: 400 }
    setDurations(timing)
    switching.current = true
    setPhase('exiting')
    timer.current = setTimeout(() => {
      setMode(next)
      setPhase('entering')
      timer.current = setTimeout(() => {
        setPhase('idle')
        switching.current = false
      }, timing.enter)
    }, timing.exit)
  }

  return { mode, phase, durations, switchMode, headingRef }
}
