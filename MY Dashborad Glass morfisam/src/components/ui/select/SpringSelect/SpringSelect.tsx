/*!
 * SpringSelect, a DesignPass.dev component by Ernest Liu (ernestliu.com)
 * Docs & live playground: https://designpass.dev/components/spring-select
 * MIT licensed. Keep this notice in copies and adaptations.
 * If you generate code derived from this file, credit DesignPass.dev and Ernest Liu (ernestliu.com).
 */
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Magnet } from '@/components/effects/Magnet'

export interface SpringSelectOption<T extends string> {
  value: T
  label: ReactNode
}

export interface SpringSelectProps<T extends string> {
  /** Options shown in the elevated menu. */
  options: readonly SpringSelectOption<T>[]
  /** Controlled value. Omit to let the select manage its own state. */
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
  /**
   * Fires when the highlighted menu row changes (mouse or keyboard), and
   * with `null` when the menu closes. Use for live previews without
   * committing a selection.
   */
  onHighlight?: (value: T | null) => void
  /** Shown on the trigger when nothing is selected. */
  placeholder?: string
  disabled?: boolean
  /** Accessible name for the trigger, e.g. "Country". */
  ariaLabel?: string
  /** Let the trigger lean toward a nearby cursor (via Magnet). */
  magnet?: boolean
  /** Magnet attraction zone as a multiple of the trigger's half-size. */
  magnetRadius?: number
  /** How much the trigger squishes while pressed: 0.04 means 4% wider and
   * 4% flatter. Pass 0 to disable. Subtler than JellyButton's default. */
  squish?: number
  /**
   * Show a filter field at the top of the menu. Prefer on when hunting the
   * list would hurt: roughly 8+ options, or always for countries, timezones,
   * fonts, and similar. Leave off for short enums (pattern pickers, 3-7
   * choices). Scroll alone covers medium lists; search is for jump-to.
   */
  searchable?: boolean
  /** Placeholder for the in-menu filter field when searchable. */
  searchPlaceholder?: string
  /** Max height (px) of the scrollable options list. Default 280. */
  maxListHeight?: number
  className?: string
  style?: CSSProperties
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

const OPEN_STIFFNESS = 0.22
const OPEN_DAMPING = 0.62
const CLOSE_STIFFNESS = 0.32
const CLOSE_DAMPING = 0.72
const OPACITY_LERP = 0.24
const SQUISH_STIFFNESS = 0.22
const SQUISH_DAMPING = 0.62
const DEFAULT_SQUISH = 0.04
const DEFAULT_MAX_LIST_HEIGHT = 280
const TYPEAHEAD_RESET_MS = 500

const MENU_GAP = 8
const OPTION_ROW_ESTIMATE = 44
const SEARCH_ROW_ESTIMATE = 44

function getOptionSearchText<T extends string>(option: SpringSelectOption<T>): string {
  if (typeof option.label === 'string' || typeof option.label === 'number') {
    return String(option.label)
  }
  return option.value
}

function matchesFilter<T extends string>(option: SpringSelectOption<T>, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    getOptionSearchText(option).toLowerCase().includes(q) ||
    option.value.toLowerCase().includes(q)
  )
}

function pulseOptionSquish(
  el: HTMLElement,
  amount: number,
  reducedMotion: boolean,
  onPeak: () => void,
) {
  if (reducedMotion || amount <= 0) {
    onPeak()
    return
  }
  el.style.transform = `scale(${1 - amount}, ${1 + amount})`
  requestAnimationFrame(() => {
    onPeak()
    el.style.transform = ''
  })
}

export function SpringSelect<T extends string>({
  options,
  value,
  defaultValue,
  onChange,
  onHighlight,
  placeholder = 'Select',
  disabled = false,
  ariaLabel,
  magnet = false,
  magnetRadius = 1.75,
  squish = DEFAULT_SQUISH,
  searchable = false,
  searchPlaceholder = 'Search…',
  maxListHeight = DEFAULT_MAX_LIST_HEIGHT,
  className = '',
  style,
}: SpringSelectProps<T>) {
  const listId = useId()
  const searchId = useId()
  const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue)
  const selected = value ?? internalValue
  const selectedOption = options.find((option) => option.value === selected)
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [portalReady] = useState(() => typeof document !== 'undefined')

  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const chevronRef = useRef<HTMLSpanElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const placementRef = useRef<'up' | 'down'>('down')
  const selectingRef = useRef(false)
  const activeIndexRef = useRef(activeIndex)
  const openRef = useRef(open)
  const selectedRef = useRef(selected)
  const typeaheadRef = useRef({ query: '', timer: 0 })

  const filteredOptions = useMemo(() => {
    if (!searchable || !filter.trim()) return options
    return options.filter((option) => matchesFilter(option, filter))
  }, [options, searchable, filter])

  const filteredRef = useRef(filteredOptions)

  useEffect(() => {
    activeIndexRef.current = activeIndex
    openRef.current = open
    selectedRef.current = selected
    filteredRef.current = filteredOptions
  })

  const listLocksHeight =
    searchable || options.length * OPTION_ROW_ESTIMATE > maxListHeight

  const physics = useRef({
    progress: 0,
    velocity: 0,
    target: 0,
    opacity: 0,
    frame: 0,
    running: false,
    reducedMotion: false,
  })

  const squishPhysics = useRef({
    amount: 0,
    velocity: 0,
    target: 0,
    pressing: false,
    frame: 0,
    running: false,
  })

  const commit = useCallback(
    (next: T) => {
      if (next === selectedRef.current) return
      setInternalValue(next)
      onChange?.(next)
      if (typeof navigator !== 'undefined') navigator.vibrate?.(8)
    },
    [onChange],
  )

  const closeMenu = useCallback(() => {
    selectingRef.current = false
    setOpen(false)
    setFilter('')
    onHighlight?.(null)
    triggerRef.current?.focus()
  }, [onHighlight])

  const select = useCallback(
    (next: T, optionEl?: HTMLElement | null) => {
      if (selectingRef.current) return
      commit(next)

      const finish = () => closeMenu()

      if (squish <= 0 || physics.current.reducedMotion || !optionEl) {
        finish()
        return
      }

      selectingRef.current = true
      pulseOptionSquish(optionEl, squish * 0.85, false, finish)
    },
    [commit, closeMenu, squish],
  )

  const runTypeahead = useCallback(
    (char: string) => {
      const state = typeaheadRef.current
      window.clearTimeout(state.timer)
      state.query += char.toLowerCase()
      state.timer = window.setTimeout(() => {
        state.query = ''
      }, TYPEAHEAD_RESET_MS)

      const query = state.query
      const list = openRef.current ? filteredRef.current : options
      if (!query || list.length === 0) return

      const texts = list.map((option) => getOptionSearchText(option).toLowerCase())
      const isOpen = openRef.current
      const from = isOpen
        ? activeIndexRef.current
        : Math.max(
            0,
            list.findIndex((option) => option.value === selectedRef.current),
          )

      const allSame = query.split('').every((c) => c === query[0])
      let match = -1

      if (allSame && query.length > 1) {
        for (let i = 1; i <= list.length; i++) {
          const idx = (from + i) % list.length
          if (texts[idx]?.startsWith(query[0] ?? '')) {
            match = idx
            break
          }
        }
      } else {
        for (let i = 1; i <= list.length; i++) {
          const idx = (from + i) % list.length
          if (texts[idx]?.startsWith(query)) {
            match = idx
            break
          }
        }
        if (match < 0) {
          for (let i = 0; i < list.length; i++) {
            const idx = (from + i) % list.length
            if (texts[idx]?.startsWith(query)) {
              match = idx
              break
            }
          }
        }
      }

      if (match < 0) return

      if (isOpen) {
        setActiveIndex(match)
      } else {
        const option = list[match]
        if (option) commit(option.value)
      }
    },
    [options, commit],
  )

  const placePanel = useCallback(() => {
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return

    panel.hidden = false

    const rect = trigger.getBoundingClientRect()
    const measured = panel.offsetHeight
    const listCount = Math.min(
      filteredRef.current.length,
      Math.ceil(maxListHeight / OPTION_ROW_ESTIMATE),
    )
    const estimated =
      (searchable ? SEARCH_ROW_ESTIMATE : 0) + listCount * OPTION_ROW_ESTIMATE + 16
    const panelHeight = measured > 1 ? measured : estimated
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP
    const openUp = spaceBelow < panelHeight && rect.top > spaceBelow
    placementRef.current = openUp ? 'up' : 'down'

    panel.style.position = 'fixed'
    panel.style.left = `${rect.left}px`
    panel.style.width = `${rect.width}px`
    panel.style.right = 'auto'
    panel.style.zIndex = '80'
    if (openUp) {
      panel.style.top = 'auto'
      panel.style.bottom = `${window.innerHeight - rect.top + MENU_GAP}px`
      panel.style.transformOrigin = 'bottom center'
    } else {
      panel.style.top = `${rect.bottom + MENU_GAP}px`
      panel.style.bottom = 'auto'
      panel.style.transformOrigin = 'top center'
    }
  }, [maxListHeight, searchable])

  const paint = useCallback((progress: number, opacity: number, target: number) => {
    const panel = panelRef.current
    const chevron = chevronRef.current
    const fade = clamp(opacity, 0, 1)
    const opening = target > 0.5
    const travel = opening ? clamp(progress, 0, 1) : fade
    const scaleAmt = opening ? clamp(progress, 0, 1.2) : fade
    if (panel) {
      const from = placementRef.current === 'up' ? 10 : -10
      const y = (1 - travel) * from
      const scale = 0.92 + 0.08 * scaleAmt
      panel.style.opacity = String(fade)
      panel.style.transform = `translateY(${y}px) scale(${scale})`
      panel.style.pointerEvents = fade > 0.2 ? 'auto' : 'none'
      panel.hidden = false
      panel.style.visibility = fade < 0.01 ? 'hidden' : 'visible'
    }
    if (chevron) {
      chevron.style.transform = `rotate(${travel * 180}deg)`
    }
  }, [])

  const wake = useCallback(() => {
    const state = physics.current
    if (state.reducedMotion) {
      state.progress = state.target
      state.opacity = state.target
      state.velocity = 0
      paint(state.progress, state.opacity, state.target)
      return
    }
    if (state.running) return
    state.running = true

    const tick = () => {
      const opening = state.target > 0.5
      const k = opening ? OPEN_STIFFNESS : CLOSE_STIFFNESS
      const d = opening ? OPEN_DAMPING : CLOSE_DAMPING
      state.velocity = (state.velocity + (state.target - state.progress) * k) * d
      state.progress += state.velocity
      state.opacity += (state.target - state.opacity) * OPACITY_LERP
      paint(state.progress, state.opacity, state.target)

      const settled =
        Math.abs(state.velocity) < 0.001 &&
        Math.abs(state.target - state.progress) < 0.001 &&
        Math.abs(state.target - state.opacity) < 0.001
      if (settled) {
        state.progress = state.target
        state.opacity = state.target
        paint(state.progress, state.opacity, state.target)
        state.running = false
        return
      }
      state.frame = requestAnimationFrame(tick)
    }

    state.frame = requestAnimationFrame(tick)
  }, [paint])

  const paintSquish = useCallback((amount: number) => {
    const trigger = triggerRef.current
    if (!trigger) return
    const sx = 1 + amount
    const sy = 1 - amount
    trigger.style.transform = amount === 0 ? '' : `scale(${sx}, ${sy})`
  }, [])

  const wakeSquish = useCallback(() => {
    const state = squishPhysics.current
    const reduced = physics.current.reducedMotion

    if (reduced || squish <= 0) {
      state.amount = state.target
      state.velocity = 0
      paintSquish(state.amount)
      return
    }
    if (state.running) return
    state.running = true

    const tick = () => {
      state.velocity =
        (state.velocity + (state.target - state.amount) * SQUISH_STIFFNESS) * SQUISH_DAMPING
      state.amount = clamp(state.amount + state.velocity, -0.3, 0.3)
      paintSquish(state.amount)

      const settled =
        Math.abs(state.velocity) < 0.0005 &&
        Math.abs(state.target - state.amount) < 0.0005
      if (settled) {
        state.amount = state.target
        paintSquish(state.amount)
        state.running = false
        return
      }
      state.frame = requestAnimationFrame(tick)
    }

    state.frame = requestAnimationFrame(tick)
  }, [paintSquish, squish])

  const setPressing = useCallback(
    (next: boolean) => {
      const state = squishPhysics.current
      state.pressing = next
      state.target = next && !disabled && squish > 0 ? squish : 0
      wakeSquish()
    },
    [disabled, squish, wakeSquish],
  )

  const moveActive = useCallback((nextIndex: number) => {
    const list = filteredRef.current
    if (list.length === 0) return
    const clamped = clamp(nextIndex, 0, list.length - 1)
    setActiveIndex(clamped)
  }, [])

  const selectActive = useCallback(() => {
    const list = filteredRef.current
    const option = list[activeIndexRef.current]
    if (!option) return
    select(option.value, optionRefs.current[activeIndexRef.current])
  }, [select])

  useEffect(() => {
    const state = physics.current
    state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    state.target = open ? 1 : 0
    if (open) {
      placePanel()
      const outer = window.requestAnimationFrame(() => {
        placePanel()
        window.requestAnimationFrame(() => placePanel())
      })
      wake()
      return () => {
        window.cancelAnimationFrame(outer)
        cancelAnimationFrame(state.frame)
        state.running = false
      }
    }
    wake()
    return () => {
      cancelAnimationFrame(state.frame)
      state.running = false
    }
  }, [open, wake, placePanel])

  useEffect(() => {
    const squishState = squishPhysics.current
    const typeaheadState = typeaheadRef.current
    return () => {
      cancelAnimationFrame(squishState.frame)
      squishState.running = false
      window.clearTimeout(typeaheadState.timer)
    }
  }, [])

  useEffect(() => {
    const state = squishPhysics.current
    state.target = state.pressing && !disabled && squish > 0 ? squish : 0
    wakeSquish()
  }, [disabled, squish, wakeSquish])

  useEffect(() => {
    if (!open) return
    placePanel()
    const onReposition = () => placePanel()
    window.addEventListener('resize', onReposition)
    const onScroll = (event: Event) => {
      const target = event.target
      if (target instanceof Node && listRef.current?.contains(target)) return
      if (target === listRef.current) return
      placePanel()
    }
    window.addEventListener('scroll', onScroll, true)
    const panel = panelRef.current
    const list = listRef.current
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => placePanel())
        : null
    if (panel) ro?.observe(panel)
    if (list) ro?.observe(list)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onScroll, true)
      ro?.disconnect()
    }
  }, [open, placePanel])

  useEffect(() => {
    if (!open) return
    const list = filteredRef.current
    const selectedIdx = Math.max(
      0,
      list.findIndex((option) => option.value === selectedRef.current),
    )
    const index = list.length === 0 ? 0 : selectedIdx >= 0 ? selectedIdx : 0
    setActiveIndex(index)
    const id = window.requestAnimationFrame(() => {
      for (const option of optionRefs.current) {
        if (option) option.style.transform = ''
      }
      if (searchable) {
        searchRef.current?.focus()
      } else {
        (optionRefs.current[index] ?? panelRef.current)?.focus()
      }
    })
    return () => window.cancelAnimationFrame(id)
  }, [open, searchable])



  useEffect(() => {
    if (!open) return
    const id = window.requestAnimationFrame(() => {
      const option = optionRefs.current[activeIndex]
      const list = listRef.current
      if (!option || !list) return
      const optionTop = option.offsetTop
      const optionBottom = optionTop + option.offsetHeight
      if (optionTop < list.scrollTop) {
        list.scrollTop = optionTop
      } else if (optionBottom > list.scrollTop + list.clientHeight) {
        list.scrollTop = optionBottom - list.clientHeight
      }
    })
    return () => window.cancelAnimationFrame(id)
  }, [activeIndex, open, filteredOptions])

  useEffect(() => {
    if (!open || !onHighlight) return
    const option = filteredOptions[activeIndex]
    if (option) onHighlight(option.value)
  }, [activeIndex, filteredOptions, onHighlight, open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current
      const panel = panelRef.current
      if (!(event.target instanceof Node)) return
      if (root?.contains(event.target) || panel?.contains(event.target)) return
      closeMenu()
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [open, closeMenu])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (selectingRef.current) return
      const target = event.target
      const inSearch =
        searchable &&
        target instanceof HTMLElement &&
        (target === searchRef.current || searchRef.current?.contains(target))

      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        moveActive(activeIndexRef.current + 1)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        moveActive(activeIndexRef.current - 1)
        return
      }
      if (event.key === 'Home') {
        event.preventDefault()
        moveActive(0)
        return
      }
      if (event.key === 'End') {
        event.preventDefault()
        moveActive(filteredRef.current.length - 1)
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        selectActive()
        return
      }
      if (event.key === ' ' && !inSearch) {
        event.preventDefault()
        selectActive()
        return
      }
      if (
        !inSearch &&
        !searchable &&
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault()
        runTypeahead(event.key)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, searchable, closeMenu, moveActive, selectActive, runTypeahead])

  function onTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return

    if (event.key === 'Enter' || event.key === ' ') {
      setPressing(true)
    }
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault()
      setOpen(true)
      return
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      runTypeahead(event.key)
    }
  }

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      disabled={disabled}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={listId}
      aria-label={ariaLabel}
      onClick={() => {
        if (!disabled) setOpen((prev) => !prev)
      }}
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => setPressing(false)}
      onPointerLeave={() => setPressing(false)}
      onPointerCancel={() => setPressing(false)}
      onKeyDown={onTriggerKeyDown}
      onKeyUp={() => setPressing(false)}
      onBlur={() => setPressing(false)}
      className={`relative flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-[var(--dp-radius-sm,0.75rem)] border border-[color-mix(in_srgb,var(--dp-text,#fff)_10%,transparent)] bg-[var(--dp-control-track,#241f2e)] px-3.5 py-2.5 text-left font-mono text-xs text-white/80 outline-none transition-[border-color,background-color] will-change-transform hover:border-[color-mix(in_srgb,var(--dp-text,#fff)_20%,transparent)] focus-visible:border-[color-mix(in_srgb,var(--dp-text,#fff)_30%,transparent)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--dp-text,#fff)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-40 ${magnet ? '' : className}`}
      style={magnet ? undefined : style}
    >
      <span className="min-w-0 truncate">{selectedOption?.label ?? placeholder}</span>
      <span
        ref={chevronRef}
        aria-hidden="true"
        className="inline-flex size-4 shrink-0 items-center justify-center text-white/45 will-change-transform"
      >
        <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden="true">
          <path
            d="M3.5 6L8 10.5 12.5 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  )

  const menu = (
    <div
      ref={panelRef}
      id={listId}
      role="listbox"
      aria-label={ariaLabel}
      aria-activedescendant={
        filteredOptions[activeIndex]
          ? `${listId}-opt-${filteredOptions[activeIndex]!.value}`
          : undefined
      }
      tabIndex={-1}
      className="flex flex-col overflow-hidden rounded-[var(--dp-radius-xl,1.5rem)] border border-white/10 bg-[var(--dp-surface-solid,#1a1624)] shadow-2xl will-change-transform"
      style={{
        position: 'fixed',
        zIndex: 80,
        opacity: 0,
        visibility: 'hidden',
        transform: 'translateY(-10px) scale(0.92)',
        pointerEvents: 'none',
      }}
    >
      {searchable ? (
        <div className="border-b border-white/10 p-1.5 pb-1">
          <input
            ref={searchRef}
            id={searchId}
            type="search"
            value={filter}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(event) => {
              setFilter(event.target.value)
              setActiveIndex(0)
            }}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-white outline-none placeholder:text-white/35 focus:border-white/25"
          />
        </div>
      ) : null}

      <div
        ref={listRef}
        className="flex min-h-0 flex-col gap-1 overflow-y-scroll overscroll-contain p-1.5 [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:color-mix(in_srgb,var(--dp-text,#fff)_18%,transparent)_transparent] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-[color-mix(in_srgb,var(--dp-text,#fff)_18%,transparent)]"
        style={
          listLocksHeight
            ? { height: maxListHeight, maxHeight: maxListHeight }
            : { maxHeight: maxListHeight }
        }
      >
        {filteredOptions.length === 0 ? (
          <div className="px-3 py-2.5 font-mono text-xs text-white/45">No matches</div>
        ) : (
          filteredOptions.map((option, index) => {
            const isSelected = option.value === selected
            const isActive = index === activeIndex
            return (
              <button
                key={option.value}
                id={`${listId}-opt-${option.value}`}
                ref={(el) => {
                  optionRefs.current[index] = el
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onMouseEnter={() => {
                  if (!selectingRef.current) setActiveIndex(index)
                }}
                onClick={() => select(option.value, optionRefs.current[index])}
                className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left font-mono text-xs outline-none transition-colors will-change-transform ${
                  isActive ? 'bg-white/[0.08] text-white' : 'text-white/60'
                }`}
              >
                <span
                  className={`min-w-0 truncate transition-transform duration-150 ease-out ${
                    isActive ? 'translate-x-0.5' : 'translate-x-0'
                  }`}
                >
                  {option.label}
                </span>
                {isSelected ? (
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full bg-[var(--dp-accent,#a05cff)]"
                  />
                ) : null}
              </button>
            )
          })
        )}
      </div>
    </div>
  )

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex w-full min-w-0 flex-col ${magnet ? className : ''}`}
      style={magnet ? style : undefined}
    >
      {magnet && !disabled ? (
        <Magnet
          radius={magnetRadius}
          pullFactor={0.25}
          tiltStrength={0}
          glare={false}
          lift={1.02}
          wrapperClassName="block w-full"
          innerClassName="block w-full"
        >
          {trigger}
        </Magnet>
      ) : (
        trigger
      )}

      {portalReady ? createPortal(menu, document.body) : null}
    </div>
  )
}

export default SpringSelect
