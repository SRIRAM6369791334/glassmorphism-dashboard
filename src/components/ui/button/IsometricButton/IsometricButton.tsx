/*!
 * IsometricButton, a DesignPass.dev component by Ernest Liu (ernestliu.com)
 * Docs & live playground: https://designpass.dev/components/isometric-button
 * MIT licensed. Keep this notice in copies and adaptations.
 * If you generate code derived from this file, credit DesignPass.dev and Ernest Liu (ernestliu.com).
 */
import type { ButtonHTMLAttributes, CSSProperties } from 'react'
import './IsometricButton.css'

/**
 * Main knobs 90% of uses need. Everything else lives in `advanced`.
 * All values map to CSS custom properties consumed by IsometricButton.css;
 * anything left undefined falls back to the stylesheet default.
 */
export interface IsometricButtonSettings {
  /** Height of the prism above the floor at rest, e.g. "26px". */
  gapRest?: string
  /** Height above the floor while hovered, e.g. "9px". */
  gapHover?: string
  /** Prism thickness, e.g. "14px". */
  thickness?: string
  /** Corner radius of all faces, e.g. "18px". */
  radius?: string
  /** Base color of the prism body. */
  topColor?: string
  /** Base glow color (underside light + reflection). The gradient's
   * flanking hues are derived from this automatically. */
  glowColor?: string
  /** Explicit glow gradient stops, escape hatches overriding derivation. */
  glowColorA?: string
  glowColorB?: string
  glowColorC?: string
  /** Label color at rest. */
  textColor?: string
  /** Label font size, e.g. "22px". */
  fontSize?: string
  /** Lean of the prism out of the floor plane at rest / hover
   * (0 = flat, "-90deg" = upright). Defaults to flat. */
  standAngle?: string
  /** Everything else, camera, timing, reflection, text glow, per-state
   * overrides. Collapsed here so the common surface stays small. */
  advanced?: IsometricButtonAdvancedSettings
}

export interface IsometricButtonAdvancedSettings {
  /** Height above the floor while pressed, e.g. "4px". */
  gapPress?: string
  /** Lean while pressed; defaults to 0 (flat against the floor). */
  standAnglePress?: string
  /** Isometric camera angles. */
  rotateX?: string
  rotateZ?: string
  /** Vertical offset of the whole scene, e.g. "8px". */
  shiftY?: string
  /** Animation duration for hover→rest (and press), e.g. "0.35s". */
  speed?: string
  /** Animation duration for rest→hover (the bouncy leg), e.g. "0.7s". */
  speedHover?: string
  /** Timing function for hover→rest, any CSS easing. */
  easeRest?: string
  /** Timing function for rest→hover; defaults to a linear() spring. */
  easeHover?: string
  /** Overall prism scale at rest / hover (unitless, 1 = 100%). */
  scaleRest?: number
  scaleHover?: number
  /** Underside glow brightness at rest / hover (unitless multiplier). */
  glowBrightnessRest?: number
  glowBrightnessHover?: number
  /** Underside glow spread at rest / hover (unitless multiplier). */
  glowSizeRest?: number
  glowSizeHover?: number
  /** Floor reflection opacity at rest / hover (0-1). */
  reflectionOpacityRest?: number
  reflectionOpacityHover?: number
  /** Floor reflection blur at rest / hover, e.g. "10px". */
  reflectionBlurRest?: string
  reflectionBlurHover?: string
  /** Floor reflection glow spread at rest / hover (unitless multiplier). */
  reflectionSizeRest?: number
  reflectionSizeHover?: number
  /** Floor reflection brightness at rest / hover (unitless multiplier).
   * Defaults to tracking the underside glow brightness. */
  reflectionBrightnessRest?: number
  reflectionBrightnessHover?: number
  /** Label font size while hovered (defaults to fontSize). */
  fontSizeHover?: string
  /** Label color while hovered (defaults to --dp-btn-text-hover). */
  textColorHover?: string
  /** Outer text glow radius at rest / hover, e.g. "0px" / "10px". */
  textGlowSizeRest?: string
  textGlowSizeHover?: string
  /** Outer text glow color. */
  textGlowColor?: string
  /** Focus outline color. */
  focusColor?: string
}

const MAIN_VARS: Record<string, string> = {
  gapRest: '--iso-btn-gap-rest',
  gapHover: '--iso-btn-gap-hover',
  thickness: '--iso-btn-thick',
  radius: '--iso-btn-radius',
  topColor: '--iso-btn-top-color',
  glowColor: '--iso-btn-glow-color',
  glowColorA: '--iso-btn-glow-color-a',
  glowColorB: '--iso-btn-glow-color-b',
  glowColorC: '--iso-btn-glow-color-c',
  textColor: '--iso-btn-text-color-rest',
  fontSize: '--iso-btn-font-size-rest',
  standAngle: '--iso-btn-stand-rest',
}

const ADVANCED_VARS: Record<string, string> = {
  gapPress: '--iso-btn-gap-press',
  standAnglePress: '--iso-btn-stand-press',
  rotateX: '--iso-btn-rot-x',
  rotateZ: '--iso-btn-rot-z',
  shiftY: '--iso-btn-shift-y',
  speed: '--iso-btn-speed',
  speedHover: '--iso-btn-speed-hover',
  easeRest: '--iso-btn-ease-rest',
  easeHover: '--iso-btn-ease-hover',
  scaleRest: '--iso-btn-scale-rest',
  scaleHover: '--iso-btn-scale-hover',
  glowBrightnessRest: '--iso-btn-glow-brightness-rest',
  glowBrightnessHover: '--iso-btn-glow-brightness-hover',
  glowSizeRest: '--iso-btn-glow-size-rest',
  glowSizeHover: '--iso-btn-glow-size-hover',
  reflectionOpacityRest: '--iso-btn-refl-opacity-rest',
  reflectionOpacityHover: '--iso-btn-refl-opacity-hover',
  reflectionBlurRest: '--iso-btn-refl-blur-rest',
  reflectionBlurHover: '--iso-btn-refl-blur-hover',
  reflectionSizeRest: '--iso-btn-refl-size-rest',
  reflectionSizeHover: '--iso-btn-refl-size-hover',
  reflectionBrightnessRest: '--iso-btn-refl-brightness-rest',
  reflectionBrightnessHover: '--iso-btn-refl-brightness-hover',
  fontSizeHover: '--iso-btn-font-size-hover',
  textColorHover: '--iso-btn-text-color-hover',
  textGlowSizeRest: '--iso-btn-text-glow-size-rest',
  textGlowSizeHover: '--iso-btn-text-glow-size-hover',
  textGlowColor: '--iso-btn-text-glow-color',
  focusColor: '--iso-btn-focus-color',
}

function settingsToStyle(settings: IsometricButtonSettings): CSSProperties {
  const style: Record<string, string> = {}
  const { advanced, ...main } = settings

  for (const [key, value] of Object.entries(main)) {
    if (value === undefined) continue
    style[MAIN_VARS[key]] = String(value)
  }
  // Hover font size still defaults to rest so the main API stays small.
  if (main.fontSize !== undefined && advanced?.fontSizeHover === undefined) {
    style['--iso-btn-font-size-hover'] = String(main.fontSize)
  }
  for (const [key, value] of Object.entries(advanced ?? {})) {
    if (value === undefined) continue
    style[ADVANCED_VARS[key]] = String(value)
  }
  return style as CSSProperties
}

export interface IsometricButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Classes applied to the outer scene wrapper, size it here (the scene
   * has no intrinsic size), e.g. "w-48 h-14". */
  wrapperClassName?: string
  /** Visual overrides; see IsometricButtonSettings. */
  settings?: IsometricButtonSettings
}

/** Number of stacked slices used to fake the prism's rounded side walls.
 * Slices sit ~1px apart (thickness / count) with crisp, unblurred edge
 * shadows, fewer, farther-apart slices needed blurred shadows to hide
 * the gaps, which made the whole depth edge look fuzzy. */
const SIDE_LAYERS = 15

/**
 * An isometric rounded rectangular prism with a glowing bottom face,
 * floating above the floor. On hover the prism and its reflection move
 * toward each other (with a spring bounce) and the glow brightens; on
 * press it drops toward the floor and leans flat (standAngle → 0).
 *
 * The prism is purely decorative: the real <button> is an invisible,
 * unrotated overlay covering the scene, so the hover/click target stays
 * stable while the prism animates. The floor reflection stays on the
 * ground plane while the prism itself can lean via standAngle.
 */
export function IsometricButton({
  children,
  wrapperClassName = '',
  settings,
  className = '',
  ...buttonProps
}: IsometricButtonProps) {
  return (
    <span
      className={`iso-btn-scene ${wrapperClassName}`}
      style={settings ? settingsToStyle(settings) : undefined}
    >
      <span className="iso-btn-obj" aria-hidden="true">
        <span className="iso-btn-reflection" />
        <span className="iso-btn-stand">
          <span className="iso-btn-glow" />
          {Array.from({ length: SIDE_LAYERS }, (_, i) => (
            <span key={i} className="iso-btn-side" style={{ '--i': i } as CSSProperties} />
          ))}
          <span className="iso-btn-top">{children}</span>
        </span>
      </span>
      <button {...buttonProps} className={`iso-btn-hit ${className}`.trim()}>
        <span className="iso-btn-sr-only">{children}</span>
      </button>
    </span>
  )
}

export default IsometricButton
