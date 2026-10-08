/*!
 * SpringSlider, a DesignPass.dev component by Ernest Liu (ernestliu.com)
 * Docs & live playground: https://designpass.dev/components/spring-slider
 * MIT licensed. Keep this notice in copies and adaptations.
 * If you generate code derived from this file, credit DesignPass.dev and Ernest Liu (ernestliu.com).
 */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { Magnet } from '@/components/effects/Magnet'

export type SpringSliderHandle = {
  /**
   * Paint the thumb/fill to `value` without a React re-render. Ignored
   * while dragging. Pair with `followValue={false}` for playheads.
   */
  setVisualValue: (value: number) => void
}

export interface SpringSliderProps {
  /** Controlled value. Omit to let the slider manage its own state. */
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  onChange?: (value: number) => void
  /** Fires once when a pointer drag begins on the track. */
  onDragStart?: () => void
  /** Fires when a pointer drag ends, with the settled value. */
  onDragEnd?: (value: number) => void
  /**
   * When true, fire `onChange` continuously while dragging so parents can
   * live-update (playgrounds, linked previews). Default false keeps React
   * out of the pointer path until release; the thumb, fill, and in-track
   * value still paint either way. Controlled `value` updates are ignored
   * mid-drag, so live commits do not fight the thumb.
   */
  live?: boolean
  /**
   * How controlled `value` updates move the thumb when not dragging.
   * `spring` (default) eases to the new value. `snap` jumps immediately,
   * for playheads / scrubbers that tick every frame.
   */
  valueMotion?: 'spring' | 'snap'
  /**
   * When false, controlled `value` does not move the thumb. Use
   * `setVisualValue` via ref for high-frequency playheads so React is
   * not in the paint path. Default true.
   */
  followValue?: boolean
  /** Control height in px, the track is the full height, like a channel
   * the thumb rides in. */
  size?: number
  /** Resting thumb width in px. Defaults to a full-height circle. */
  thumbWidth?: number
  /** Thumb width while the pointer is over the slider (or while
   * dragging). Springs from `thumbWidth` on enter. Omit for a fixed
   * width. */
  thumbWidthHover?: number
  /** Resting thumb height in px. Defaults to the track's inner height. */
  thumbHeight?: number
  /** Thumb height while the pointer is over the slider (or while
   * dragging). Springs from `thumbHeight` on enter. Omit for a fixed
   * height. Can grow taller than the track. */
  thumbHeightHover?: number
  /** Render a tick mark at every step (skipped when steps are too dense). */
  showSteps?: boolean
  /** Render the current value pinned to the right edge of the track (on
   * by default); the thumb slides underneath it. The number follows the
   * pointer while dragging even when `live` is false. */
  showValue?: boolean
  /** Optional label rendered inside the track on the left; the thumb
   * slides underneath it. */
  label?: React.ReactNode
  /** Corner radius in px for the track and thumb. Omit for a fully
   * rounded pill. */
  radius?: number
  disabled?: boolean
  /** Accessible name, e.g. "Volume". */
  ariaLabel?: string
  className?: string
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

const DRAG_STIFFNESS = 0.5
const DRAG_DAMPING = 0.55
const RELEASE_STIFFNESS = 0.14
const RELEASE_DAMPING = 0.78
const BORDER = 1
const HOVER_SCALE = 1.15
const PRESS_SCALE = 1.25
const SCALE_STIFFNESS = 0.25
const SCALE_DAMPING = 0.7
const SIZE_STIFFNESS = 0.28
const SIZE_DAMPING = 0.55
const MAX_TICKS = 41

export const SpringSlider = forwardRef<SpringSliderHandle, SpringSliderProps>(
  function SpringSlider(
    {
      value,
      defaultValue,
      min = 0,
      max = 100,
      step = 1,
      onChange,
      onDragStart,
      onDragEnd,
      live = false,
      valueMotion = 'spring',
      followValue = true,
      size = 24,
      thumbWidth,
      thumbWidthHover,
      thumbHeight,
      thumbHeightHover,
      showSteps = false,
      showValue = true,
      label,
      radius,
      disabled = false,
      ariaLabel,
      className = '',
    },
    ref,
  ) {
    const [internalValue, setInternalValue] = useState(defaultValue ?? min)
    const current = clamp(value ?? internalValue, min, max)
    const fraction = max > min ? (current - min) / (max - min) : 0
    const trackInner = Math.max(size - BORDER * 2, 1)
    const thumbW = thumbWidth ?? trackInner
    const thumbWHover = thumbWidthHover ?? thumbW
    const thumbH = thumbHeight ?? trackInner
    const thumbHHover = thumbHeightHover ?? thumbH
    const widthHoverEnabled = thumbWidthHover != null
    const heightHoverEnabled = thumbHeightHover != null
    const sizeHoverEnabled = widthHoverEnabled || heightHoverEnabled

    const trackRef = useRef<HTMLDivElement>(null)
    const thumbRef = useRef<HTMLDivElement>(null)
    const fillRef = useRef<HTMLDivElement>(null)
    const valueRef = useRef<HTMLSpanElement>(null)
    const minRef = useRef(min)
    const maxRef = useRef(max)
    const stepRef = useRef(step)
    const restWidthRef = useRef(thumbW)
    const liveRef = useRef(live)
    const onChangeRef = useRef(onChange)
    const onDragStartRef = useRef(onDragStart)
    const onDragEndRef = useRef(onDragEnd)
    const lastEmittedRef = useRef(current)
    minRef.current = min
    maxRef.current = max
    stepRef.current = step
    restWidthRef.current = thumbW
    liveRef.current = live
    onChangeRef.current = onChange
    onDragStartRef.current = onDragStart
    onDragEndRef.current = onDragEnd

    const dragTeardown = useRef<(() => void) | null>(null)
    const physics = useRef({
      position: fraction,
      velocity: 0,
      target: fraction,
      scale: 1,
      scaleVelocity: 0,
      scaleTarget: 1,
      width: thumbW,
      widthVelocity: 0,
      widthTarget: thumbW,
      height: thumbH,
      heightVelocity: 0,
      heightTarget: thumbH,
      hovering: false,
      dragging: false,
      frame: 0,
      running: false,
      reducedMotion: false,
    })

    useEffect(() => {
      lastEmittedRef.current = current
    }, [current])

    const commit = useCallback((next: number) => {
      const lo = minRef.current
      const hi = maxRef.current
      const stepSize = stepRef.current
      const notify = liveRef.current || !physics.current.dragging

      const emit = (rounded: number) => {
        trackRef.current?.setAttribute(
          'aria-valuenow',
          String(Math.round(rounded)),
        )
        if (valueRef.current) valueRef.current.textContent = String(rounded)
        if (rounded === lastEmittedRef.current) return rounded
        if (notify) {
          lastEmittedRef.current = rounded
          setInternalValue(rounded)
          onChangeRef.current?.(rounded)
        }
        return rounded
      }

      if (next <= lo) return emit(lo)
      if (next >= hi) return emit(hi)
      const snapped = clamp(
        Math.round((next - lo) / stepSize) * stepSize + lo,
        lo,
        hi,
      )
      return emit(Number(snapped.toFixed(6)))
    }, [])

    const render = useCallback(
      (position: number, velocity: number, scale: number, width: number, height: number) => {
        const track = trackRef.current
        const thumb = thumbRef.current
        const fill = fillRef.current
        if (!track || !thumb || !fill) return

        const w = Math.max(width, 1)
        const h = Math.max(height, 1)
        const restW = Math.max(restWidthRef.current, 1)
        const edge = sizeHoverEnabled ? 0 : (restW * (PRESS_SCALE - 1)) / 2
        const travel = Math.max(track.clientWidth - restW - edge * 2, 0)
        const x = edge + position * travel - (w - restW) / 2
        const stretch = clamp(Math.abs(velocity) * 2, 0, 0.3)
        thumb.style.width = `${w}px`
        thumb.style.height = `${h}px`
        thumb.style.transform =
          `translate(${x}px, -50%) scale(${scale * (1 + stretch)}, ${scale * (1 - stretch * 0.5)})`
        fill.style.width = `${edge + position * travel + restW / 2}px`
      },
      [sizeHoverEnabled],
    )

    const wake = useCallback(() => {
      const state = physics.current

      if (state.reducedMotion) {
        state.position = state.target
        state.scale = state.scaleTarget
        state.width = state.widthTarget
        state.height = state.heightTarget
        render(state.position, 0, state.scale, state.width, state.height)
        return
      }
      if (state.running) return
      state.running = true

      const tick = () => {
        const k = state.dragging ? DRAG_STIFFNESS : RELEASE_STIFFNESS
        const d = state.dragging ? DRAG_DAMPING : RELEASE_DAMPING
        state.velocity = (state.velocity + (state.target - state.position) * k) * d
        state.position += state.velocity
        state.scaleVelocity =
          (state.scaleVelocity + (state.scaleTarget - state.scale) * SCALE_STIFFNESS) *
          SCALE_DAMPING
        state.scale += state.scaleVelocity
        state.widthVelocity =
          (state.widthVelocity + (state.widthTarget - state.width) * SIZE_STIFFNESS) *
          SIZE_DAMPING
        state.width += state.widthVelocity
        state.heightVelocity =
          (state.heightVelocity + (state.heightTarget - state.height) * SIZE_STIFFNESS) *
          SIZE_DAMPING
        state.height += state.heightVelocity
        render(state.position, state.velocity, state.scale, state.width, state.height)

        const settled =
          !state.dragging &&
          Math.abs(state.velocity) < 0.0005 &&
          Math.abs(state.target - state.position) < 0.0005 &&
          Math.abs(state.scaleVelocity) < 0.0005 &&
          Math.abs(state.scaleTarget - state.scale) < 0.0005 &&
          Math.abs(state.widthVelocity) < 0.05 &&
          Math.abs(state.widthTarget - state.width) < 0.05 &&
          Math.abs(state.heightVelocity) < 0.05 &&
          Math.abs(state.heightTarget - state.height) < 0.05

        if (settled) {
          state.position = state.target
          state.scale = state.scaleTarget
          state.width = state.widthTarget
          state.height = state.heightTarget
          render(state.position, 0, state.scale, state.width, state.height)
          state.running = false
          return
        }
        state.frame = requestAnimationFrame(tick)
      }

      state.frame = requestAnimationFrame(tick)
    }, [render])

    useEffect(() => {
      const state = physics.current
      state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      return () => {
        dragTeardown.current?.()
        state.dragging = false
        cancelAnimationFrame(state.frame)
        state.running = false
      }
    }, [])

    useEffect(() => {
      const state = physics.current
      if (!followValue || state.dragging) return
      state.target = fraction
      if (valueMotion === 'snap' || state.reducedMotion) {
        state.position = fraction
        state.velocity = 0
        render(state.position, 0, state.scale, state.width, state.height)
      }
      wake()
    }, [fraction, valueMotion, followValue, wake, render])

    useImperativeHandle(
      ref,
      () => ({
        setVisualValue(next: number) {
          const state = physics.current
          if (state.dragging) return
          const lo = minRef.current
          const hi = maxRef.current
          const clamped = clamp(next, lo, hi)
          const f = hi > lo ? (clamped - lo) / (hi - lo) : 0
          state.target = f
          state.position = f
          state.velocity = 0
          render(state.position, 0, state.scale, state.width, state.height)
          trackRef.current?.setAttribute('aria-valuenow', String(Math.round(clamped)))
          if (valueRef.current) valueRef.current.textContent = String(clamped)
        },
      }),
      [render],
    )

    useEffect(() => {
      const state = physics.current
      const expanded = state.hovering || state.dragging
      state.widthTarget = widthHoverEnabled && expanded ? thumbWHover : thumbW
      state.heightTarget = heightHoverEnabled && expanded ? thumbHHover : thumbH
      if (!widthHoverEnabled) {
        state.width = thumbW
        state.widthTarget = thumbW
        state.widthVelocity = 0
      }
      if (!heightHoverEnabled) {
        state.height = thumbH
        state.heightTarget = thumbH
        state.heightVelocity = 0
      }
      wake()
    }, [
      thumbW,
      thumbWHover,
      thumbH,
      thumbHHover,
      widthHoverEnabled,
      heightHoverEnabled,
      wake,
    ])

    useEffect(() => {
      const track = trackRef.current
      if (!track) return
      const observer = new ResizeObserver(() => {
        const state = physics.current
        render(state.position, 0, state.scale, state.width, state.height)
      })
      observer.observe(track)
      return () => observer.disconnect()
    }, [render])

    function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
      if (disabled) return
      const track = trackRef.current
      if (!track) return

      event.preventDefault()
      track.setPointerCapture(event.pointerId)

      const state = physics.current

      const applyPointer = (clientX: number, { settle = false } = {}) => {
        const rect = track.getBoundingClientRect()
        const restW = Math.max(restWidthRef.current, 1)
        const edge = sizeHoverEnabled ? 0 : (restW * (PRESS_SCALE - 1)) / 2
        const inner = rect.width - BORDER * 2
        const travel = inner - restW - edge * 2
        if (travel <= 0) {
          state.target = 0
          return commit(min)
        }
        const raw = (clientX - rect.left - BORDER - edge - restW / 2) / travel
        if (raw <= 0) {
          state.target = 0
          return commit(min)
        }
        if (raw >= 1) {
          state.target = 1
          return commit(max)
        }
        const nextFraction = clamp(raw, 0, 1)
        const committed = commit(min + nextFraction * (max - min))
        state.target = settle
          ? max > min
            ? (committed - min) / (max - min)
            : 0
          : nextFraction
        return committed
      }

      state.dragging = true
      if (sizeHoverEnabled) {
        if (widthHoverEnabled) state.widthTarget = thumbWHover
        if (heightHoverEnabled) state.heightTarget = thumbHHover
      } else {
        state.scaleTarget = PRESS_SCALE
      }
      onDragStartRef.current?.()
      applyPointer(event.clientX)
      wake()

      const onMove = (e: PointerEvent) => {
        applyPointer(e.clientX)
        wake()
      }

      const onUp = (e: PointerEvent) => {
        detach()
        if (track.hasPointerCapture(e.pointerId)) {
          track.releasePointerCapture(e.pointerId)
        }
        state.dragging = false
        if (sizeHoverEnabled) {
          if (widthHoverEnabled) {
            state.widthTarget = state.hovering ? thumbWHover : thumbW
          }
          if (heightHoverEnabled) {
            state.heightTarget = state.hovering ? thumbHHover : thumbH
          }
        } else {
          state.scaleTarget = state.hovering ? HOVER_SCALE : 1
        }
        const committed = applyPointer(e.clientX, { settle: true })
        if (committed === min || committed === max) {
          state.position = state.target
          state.velocity = 0
          render(state.position, 0, state.scale, state.width, state.height)
        }
        onDragEndRef.current?.(committed)
        wake()
      }

      const detach = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        dragTeardown.current = null
      }

      dragTeardown.current?.()
      dragTeardown.current = detach
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    }

    function onTrackPointerEnter() {
      if (disabled) return
      const state = physics.current
      state.hovering = true
      if (sizeHoverEnabled) {
        if (widthHoverEnabled) state.widthTarget = thumbWHover
        if (heightHoverEnabled) state.heightTarget = thumbHHover
      } else if (!state.dragging) {
        state.scaleTarget = HOVER_SCALE
      }
      wake()
    }

    function onTrackPointerLeave() {
      const state = physics.current
      state.hovering = false
      if (state.dragging) return
      if (sizeHoverEnabled) {
        if (widthHoverEnabled) state.widthTarget = thumbW
        if (heightHoverEnabled) state.heightTarget = thumbH
      } else {
        state.scaleTarget = 1
      }
      wake()
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
      if (disabled) return
      let next: number | null = null
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step
      else if (event.key === 'Home') next = min
      else if (event.key === 'End') next = max
      if (next !== null) {
        event.preventDefault()
        commit(next)
      }
    }

    const tickCount = Math.round((max - min) / step) + 1
    const ticks =
      showSteps && tickCount <= MAX_TICKS && tickCount > 2
        ? Array.from({ length: tickCount }, (_, i) => i / (tickCount - 1))
        : []

    return (
      <div
        ref={trackRef}
        role="slider"
        aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={onPointerDown}
        onPointerEnter={onTrackPointerEnter}
        onPointerLeave={onTrackPointerLeave}
        onKeyDown={onKeyDown}
        style={
          {
            height: `${size}px`,
            '--ss-ink': 'var(--dp-text, #fff)',
            '--ss-track': 'var(--dp-control-track, #241f2e)',
            '--ss-radius': radius != null ? `${radius}px` : '9999px',
            '--ss-radius-inner': radius != null ? `${Math.max(radius - BORDER, 0)}px` : '9999px',
          } as React.CSSProperties
        }
        className={`relative w-full cursor-pointer select-none touch-none overflow-visible rounded-[var(--ss-radius)] border border-[color-mix(in_srgb,var(--ss-ink)_10%,transparent)] bg-[var(--ss-track)] outline-none transition-colors focus-visible:border-[color-mix(in_srgb,var(--ss-ink)_30%,transparent)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--ss-ink)_20%,transparent)] ${
          disabled ? 'cursor-not-allowed opacity-40' : ''
        } ${className}`}
      >
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[var(--ss-radius-inner)]">
          <div
            ref={fillRef}
            className="absolute inset-y-0 left-0 rounded-l-[var(--ss-radius-inner)] bg-[color-mix(in_srgb,var(--ss-ink)_15%,transparent)]"
          />
          {ticks.map((f) => (
            <span
              key={f}
              className="absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--ss-ink)_25%,transparent)]"
              style={{
                left: `calc(${thumbW / 2}px + (100% - ${thumbW}px) * ${f})`,
              }}
            />
          ))}
        </div>
        <div
          ref={thumbRef}
          data-ss-thumb=""
          aria-hidden="true"
          style={{ width: `${thumbW}px`, height: `${thumbH}px` }}
          className="absolute top-1/2 left-0 will-change-transform"
        >
          <Magnet
            radius={2}
            pullFactor={0.3}
            tiltStrength={0}
            glare={false}
            lift={1}
            wrapperClassName="size-full"
          >
            <div className="flex size-full items-center justify-center rounded-[var(--ss-radius-inner)] bg-[var(--ss-ink)]" />
          </Magnet>
        </div>
        {(label != null || showValue) && (
          <div
            aria-hidden="true"
            style={{ fontSize: `${Math.max(9, Math.round(size * 0.38))}px` }}
            className="pointer-events-none absolute inset-0 flex items-center justify-between gap-3 px-3 text-[color:var(--ss-ink,var(--dp-text,#fff))] mix-blend-difference"
          >
            <span className="min-w-0 truncate select-none">{label}</span>
            {showValue && (
              <span
                ref={valueRef}
                data-ss-value=""
                className="shrink-0 select-none font-mono tabular-nums"
              >
                {current}
              </span>
            )}
          </div>
        )}
      </div>
    )
  },
)

export default SpringSlider
