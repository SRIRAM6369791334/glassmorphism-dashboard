/*!
 * SpringAccordion, a DesignPass.dev component by Ernest Liu (ernestliu.com)
 * Docs & live playground: https://designpass.dev/components/spring-accordion
 * MIT licensed. Keep this notice in copies and adaptations.
 * If you generate code derived from this file, credit DesignPass.dev and Ernest Liu (ernestliu.com).
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type SpringAccordionItem = {
  id: string
  title: string
  content: ReactNode
}

export type SpringAccordionProps = {
  items: readonly SpringAccordionItem[]
  /**
   * `multiple` lets several panels stay open (default). `single` closes the
   * previous panel when another opens.
   */
  type?: 'single' | 'multiple'
  /** Open item id(s) on first render. */
  defaultValue?: string | string[]
  className?: string
  /**
   * How bouncy the height motion feels, 0–1. Lower is near-eased; higher
   * overshoots more. Default is restrained. Prefer this over raw stiffness /
   * damping unless you need an exact integrator tune.
   */
  springiness?: number
  /** Spring stiffness while opening. Overrides the value derived from springiness. */
  stiffness?: number
  /** Spring damping (velocity retention) while opening. Overrides springiness. */
  damping?: number
  /**
   * Drop horizontal padding on triggers and panel copy. Use when the accordion
   * already sits in a padded rail (e.g. FaqSpring) so titles align with the
   * headline. Separators still span the full accordion width either way.
   */
  flush?: boolean
}

const DEFAULT_SPRINGINESS = 0.28
const CLOSE_STIFFNESS_SCALE = 1.7
const CLOSE_DAMPING_SHIFT = 0.04

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Map a 0–1 springiness knob onto open-height integrator params. */
function springinessToParams(springiness: number): {
  stiffness: number
  damping: number
} {
  const s = clamp01(springiness)
  return {
    stiffness: 0.08 + s * 0.2,
    damping: 0.62 + s * 0.22,
  }
}

function toIdSet(value: string | string[] | undefined): Set<string> {
  if (!value) return new Set()
  return new Set(Array.isArray(value) ? value : [value])
}

export function SpringAccordion({
  items,
  type = 'multiple',
  defaultValue,
  className = '',
  springiness = DEFAULT_SPRINGINESS,
  stiffness: stiffnessProp,
  damping: dampingProp,
  flush = false,
}: SpringAccordionProps) {
  const baseId = useId()
  const [openIds, setOpenIds] = useState(() => toIdSet(defaultValue))
  const derived = springinessToParams(springiness)
  const stiffness = stiffnessProp ?? derived.stiffness
  const damping = dampingProp ?? derived.damping
  const padX = flush ? '' : 'px-4'

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        return next
      }
      if (type === 'single') return new Set([id])
      next.add(id)
      return next
    });
  }

  return (
    <div className={`w-full min-w-0 ${className}`.trim()}>
      {items.map((item, index) => {
        const open = openIds.has(item.id)
        const triggerId = `${baseId}-trigger-${item.id}`
        const panelId = `${baseId}-panel-${item.id}`
        return (
          <div
            key={item.id}
            className={index === 0 ? '' : 'border-t border-white/10'}
          >
            <h3 className="m-0">
              <button
                type="button"
                id={triggerId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className={`flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left text-base font-semibold tracking-tight text-white transition-colors hover:text-[color:var(--dp-accent,#a05cff)] ${padX}`.trim()}
              >
                <span className="min-w-0">{item.title}</span>
                {!open ? (
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-lg leading-none font-normal text-white/55"
                  >
                    +
                  </span>
                ) : null}
              </button>
            </h3>
            <SpringPanel
              id={panelId}
              labelledBy={triggerId}
              open={open}
              stiffness={stiffness}
              damping={damping}
              padX={padX}
            >
              {item.content}
            </SpringPanel>
          </div>
        )
      })}
    </div>
  )
}

function SpringPanel({
  id,
  labelledBy,
  open,
  stiffness,
  damping,
  padX,
  children,
}: {
  id: string
  labelledBy: string
  open: boolean
  stiffness: number
  damping: number
  padX: string
  children: ReactNode
}) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const tickRef = useRef<() => void>(() => {})
  const physics = useRef({
    height: 0,
    velocity: 0,
    target: 0,
    frame: 0,
    running: false,
    reducedMotion: false,
  })

  const render = useCallback(() => {
    const outer = outerRef.current
    if (!outer) return
    outer.style.height = `${Math.max(0, physics.current.height)}px`
  }, [])

  const tick = useCallback(() => {
    const state = physics.current
    const inner = innerRef.current
    const closing = state.target <= 0
    if (inner && !closing) {
      state.target = inner.scrollHeight
    }

    const k = closing
      ? Math.min(0.4, stiffness * CLOSE_STIFFNESS_SCALE)
      : stiffness
    const d = closing ? Math.max(0.55, damping - CLOSE_DAMPING_SHIFT) : damping
    const force = (state.target - state.height) * k
    state.velocity = (state.velocity + force) * d
    state.height += state.velocity

    if (closing && state.height <= 0) {
      state.height = 0
      state.velocity = 0
      state.running = false
      render()
      return
    }

    render()

    const dist = Math.abs(state.target - state.height)
    const settleDist = closing ? 1.2 : 0.4
    const settleVel = closing ? 0.85 : 0.4
    const settled = dist < settleDist && Math.abs(state.velocity) < settleVel
    if (settled) {
      state.height = state.target
      state.velocity = 0
      state.running = false
      render()
      return
    }
    state.frame = requestAnimationFrame(() => tickRef.current())
  }, [damping, render, stiffness])

  useEffect(() => {
    tickRef.current = tick
  })

  const start = useCallback(() => {
    const state = physics.current
    if (state.running) return
    state.running = true
    state.frame = requestAnimationFrame(() => tickRef.current())
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    physics.current.reducedMotion = media.matches
    const onChange = () => {
      physics.current.reducedMotion = media.matches
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const inner = innerRef.current
    const target = open && inner ? inner.scrollHeight : 0
    const state = physics.current

    if (state.reducedMotion) {
      state.height = target
      state.target = target
      state.velocity = 0
      state.running = false
      cancelAnimationFrame(state.frame)
      render()
      return
    }

    state.target = target
    start()
  }, [open, render, start, children])

  useEffect(() => {
    const frame = physics.current.frame
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      ref={outerRef}
      id={id}
      role="region"
      aria-labelledby={labelledBy}
      aria-hidden={!open}
      inert={!open}
      className="overflow-hidden"
      style={{ height: 0 }}
    >
      <div
        ref={innerRef}
        className={`pb-4 text-sm leading-relaxed text-white/60 ${padX}`.trim()}
      >
        {children}
      </div>
    </div>
  )
}

export default SpringAccordion
