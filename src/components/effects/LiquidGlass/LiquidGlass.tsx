/*!
 * LiquidGlass, a DesignPass.dev component by Ernest Liu (ernestliu.com)
 * Docs & live playground: https://designpass.dev/components/liquid-glass
 * MIT licensed. Keep this notice in copies and adaptations.
 * If you generate code derived from this file, credit DesignPass.dev and Ernest Liu (ernestliu.com).
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Magnet } from '../Magnet'

export interface LiquidGlassProps {
  children?: ReactNode
  /** Corner radius of the pane in px. */
  radius?: number
  /** Width of the refractive bezel in px, the curved rim where light bends. */
  bezel?: number
  /** Bezel cross-section. "squircle" is Apple's soft profile, "circle" is a
   * sharper spherical dome, "lip" raises the rim and dips the center. */
  profile?: 'squircle' | 'circle' | 'lip'
  /** Glass thickness in px. Thicker glass bends light further. */
  depth?: number
  /** Refraction strength multiplier. 1 is the physical bend for the given
   * depth and bezel; push past 1 to exaggerate. Scales the whole effect
   * without rebuilding the displacement map. */
  refraction?: number
  /** Lens magnification of the pane interior (1 = optically flat). Even a
   * few percent makes the whole backdrop visibly swim under the glass,
   * not just the bezel ring. */
  magnify?: number
  /** Frosted blur radius in px behind the glass. 0 is crystal clear. */
  frost?: number
  /** Backdrop saturation boost (1 = unchanged). Glass in the wild picks up
   * and intensifies the colors behind it. */
  saturation?: number
  /** Backdrop brightness multiplier (1 = unchanged). Below 1 dims the
   * backdrop for legibility, above 1 makes the glass glow. */
  brightness?: number
  /** Specular rim-light intensity (0-1). */
  specular?: number
  /** Chromatic aberration as the fractional spread between how far red and
   * blue refract (0 disables, try 0.1-0.5). In real glass blue bends more
   * than red, so the bezel splits backdrop edges into spectral fringes.
   * Implemented as per-channel displacement scales inside the same SVG
   * filter; no extra layers, no per-frame cost. */
  aberration?: number
  /** CSS selector for an img, canvas, or video element to refract in the
   * WebGL fallback (Safari, Firefox), exactly like the CodePen this path
   * is based on feeds a texture to its shader. The element is sampled as
   * a live texture (re-uploaded every frame for canvas/video), which is
   * far more reliable than DOM snapshotting and captures animated WebGL
   * backgrounds that snapshots cannot. When omitted, the fallback
   * snapshots the page with html2canvas-pro instead. Chromium ignores
   * this and refracts the real backdrop. */
  refractSelector?: string
  /** Advanced: text in the pane inverts whatever color sits beneath each
   * glyph, so it stays readable over any backdrop. Implemented without
   * blend modes (which break backdrop-filter refraction): the content is
   * rasterized into a glyph-shaped mask (via html2canvas-pro, lazy) that
   * clips a `backdrop-filter: invert(1)` overlay, and the real text
   * renders in transparent ink above it, so it stays selectable and
   * accessible. Re-rasterized on resize; intended for mostly-static text
   * content (images/icons in children keep their own colors). */
  invertContent?: boolean
  /** Glass body tint. Keep it near-transparent; it reads as material color. */
  tint?: string
  /** Drop shadow under the pane (0-1). */
  shadow?: number
  /** Squish the pane like jelly while pressed, then jiggle once or twice
   * on release. Soft enough to sell the liquid material without fighting
   * the refraction. */
  elastic?: boolean
  /** Pull the pane toward a nearby cursor via our Magnet component. Uses
   * flat 2D motion only: Magnet's 3D tilt context is a backdrop root and
   * would blank the SVG refraction. Glare stays off for the same reason
   * (mix-blend also breaks backdrop-filter). */
  magnet?: boolean
  /** Magnet attraction zone as a multiple of the pane's half-size. */
  magnetRadius?: number
  className?: string
  style?: CSSProperties
}

// Jelly press: exponential ease into the squish (never overshoots).
// Release: underdamped spring + outward kick so the jiggle reads.
const JELLY_PRESS_EASE = 0.28
const JELLY_RELEASE_STIFFNESS = 0.3
const JELLY_RELEASE_DAMPING = 0.44
/** Outward velocity on release. Sized so scale/squish visibly pass rest
 * even after a short tap (the stored spring energy alone is too small). */
const JELLY_RELEASE_SCALE_KICK = 0.12
const JELLY_RELEASE_SQUISH_KICK = 0.14
/** Pressed scale (uniform) and volume-preserving squish amount. */
const JELLY_PRESS_SCALE = 0.965
const JELLY_SQUISH = 0.07

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

const GLASS_IOR = 1.5
const PROFILE_SAMPLES = 128
/** Displacement maps are smooth gradients, so they can be baked at reduced
 * resolution and stretched by feImage with no visible loss. Capping the
 * longest side keeps the bake O(1)-ish for huge panes. */
const MAP_MAX_DIM = 480

/** Bezel height profiles, x in [0,1] from outer edge to flat interior. */
const PROFILES: Record<string, (x: number) => number> = {
  // Quartic squircle: soft flat-to-curve transition, no harsh interior edge.
  squircle: (x) => Math.pow(1 - Math.pow(1 - x, 4), 0.25),
  circle: (x) => Math.sqrt(1 - (1 - x) * (1 - x)),
  lip: (x) => {
    const convex = Math.pow(1 - Math.pow(1 - x, 4), 0.25)
    const s = x * x * x * (x * (x * 6 - 15) + 10) // smootherstep
    return convex * (1 - s) + (1 - convex) * s
  },
}

/**
 * Trace one ray per bezel sample through Snell's law and return the lateral
 * shift (px) where each ray lands on the backdrop, relative to where it
 * would land with no glass. Rays enter vertically; the surface normal comes
 * from the profile's slope, so the bend follows directly from the geometry.
 */
function traceProfile(profile: (x: number) => number, bezel: number, depth: number): Float64Array {
  const magnitudes = new Float64Array(PROFILE_SAMPLES)
  const dx = 1 / (PROFILE_SAMPLES - 1)
  for (let i = 0; i < PROFILE_SAMPLES; i++) {
    const x = i * dx
    const x0 = Math.max(0, x - dx)
    const x1 = Math.min(1, x + dx)
    // Surface slope in real units (height px per lateral px).
    const slope = ((profile(x1) - profile(x0)) * depth) / ((x1 - x0) * bezel)
    const theta1 = Math.atan(Math.abs(slope))
    const theta2 = Math.asin(Math.sin(theta1) / GLASS_IOR)
    // The bezel curve rides on a glass slab of the same thickness, so the
    // refracted ray crosses the curved cap plus the full slab before it
    // reaches the backdrop; that whole travel accumulates lateral drift.
    const travel = (profile(x) + 1) * depth
    magnitudes[i] = Math.tan(theta1 - theta2) * travel
  }
  return magnitudes
}

/**
 * Bake the displacement vector field of a rounded-rect glass pane into a
 * canvas-encoded SVG displacement map (R = X shift, G = Y shift, 128 =
 * neutral). Runs once per size, never per frame.
 */
function buildDisplacementMap(
  width: number,
  height: number,
  radius: number,
  bezel: number,
  magnify: number,
  magnitudes: Float64Array,
): { url: string; maxDisplacement: number } | null {
  const res = Math.min(1, MAP_MAX_DIM / Math.max(width, height))
  const w = Math.max(2, Math.round(width * res))
  const h = Math.max(2, Math.round(height * res))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const zoom = magnify > 1 ? 1 / magnify - 1 : 0

  let maxBezel = 0
  for (let i = 0; i < magnitudes.length; i++) {
    if (magnitudes[i] > maxBezel) maxBezel = magnitudes[i]
  }
  let maxDisplacement = maxBezel + Math.abs(zoom) * Math.hypot(width / 2, height / 2)
  if (maxDisplacement < 1e-6) maxDisplacement = 1

  const image = ctx.createImageData(w, h)
  const data = image.data
  const cx = width / 2
  const cy = height / 2
  const r = Math.min(radius, width / 2, height / 2)
  const halfW = width / 2 - r
  const halfH = height / 2 - r

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const rx = (x + 0.5) / res
      const ry = (y + 0.5) / res
      const px = Math.abs(rx - cx)
      const py = Math.abs(ry - cy)
      const qx = px - halfW
      const qy = py - halfH

      let distFromEdge: number
      let nx = 0
      let ny = 0
      if (qx > 0 && qy > 0) {
        const len = Math.hypot(qx, qy)
        distFromEdge = r - len
        if (len > 1e-6) {
          nx = qx / len
          ny = qy / len
        }
      } else if (qx > qy) {
        distFromEdge = width / 2 - px
        nx = 1
      } else {
        distFromEdge = height / 2 - py
        ny = 1
      }

      const p = (y * w + x) * 4
      let dispX = (rx - cx) * zoom
      let dispY = (ry - cy) * zoom
      if (distFromEdge >= 0 && distFromEdge < bezel) {
        const t = (distFromEdge / bezel) * (PROFILE_SAMPLES - 1)
        const lo = Math.floor(t)
        const hi = Math.min(PROFILE_SAMPLES - 1, lo + 1)
        const frac = t - lo
        const magnitude = magnitudes[lo] * (1 - frac) + magnitudes[hi] * frac
        const sx = rx - cx < 0 ? -1 : 1
        const sy = ry - cy < 0 ? -1 : 1
        dispX += -nx * sx * magnitude
        dispY += -ny * sy * magnitude
      }
      data[p] = Math.round(128 + (dispX / maxDisplacement) * 127)
      data[p + 1] = Math.round(128 + (dispY / maxDisplacement) * 127)
      data[p + 2] = 128
      data[p + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return { url: canvas.toDataURL('image/png'), maxDisplacement }
}

function supportsSvgBackdrop(): boolean {
  if (typeof CSS === 'undefined' || !CSS.supports) return false
  if (!CSS.supports('backdrop-filter', 'url(#a)')) return false
  if (CSS.supports('-moz-appearance', 'none')) return false
  const isWebKit = 'webkitConvertPointFromNodeToPage' in window
  return !isWebKit
}

type MapState = { url: string; maxDisplacement: number; width: number; height: number }

const GL_VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const GL_FRAG = `
precision highp float;
uniform sampler2D u_tex;
uniform vec2 u_texSize;
uniform float u_snapScale;
uniform vec2 u_origin;
uniform vec2 u_size;
uniform float u_dpr;
uniform float u_canvasH;
uniform float u_radius;
uniform float u_bezel;
uniform float u_depth;
uniform float u_refraction;
uniform float u_magnify;
uniform float u_frost;
uniform float u_saturation;
uniform float u_brightness;
uniform float u_aberration;
uniform int u_profile;

float profileHeight(float x) {
  x = clamp(x, 0.0, 1.0);
  float inv = 1.0 - x;
  if (u_profile == 1) { return sqrt(1.0 - inv * inv); }
  float convex = pow(1.0 - inv * inv * inv * inv, 0.25);
  if (u_profile == 2) {
    float st = x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
    return mix(convex, 1.0 - convex, st);
  }
  return convex;
}

vec2 displacementAt(vec2 local) {
  vec2 center = u_size * 0.5;
  vec2 rel = local - center;
  vec2 p = abs(rel);
  vec2 q = p - (center - vec2(u_radius));
  float distEdge;
  vec2 dir;
  if (q.x > 0.0 && q.y > 0.0) {
    float len = max(length(q), 1e-4);
    distEdge = u_radius - len;
    dir = (q / len) * sign(rel + vec2(1e-5));
  } else if (q.x > q.y) {
    distEdge = center.x - p.x;
    dir = vec2(sign(rel.x + 1e-5), 0.0);
  } else {
    distEdge = center.y - p.y;
    dir = vec2(0.0, sign(rel.y + 1e-5));
  }
  vec2 disp = rel * (1.0 / u_magnify - 1.0);
  if (distEdge >= 0.0 && distEdge < u_bezel) {
    float x = distEdge / u_bezel;
    float eps = 1.0 / 128.0;
    float slope = (profileHeight(x + eps) - profileHeight(x - eps)) / (2.0 * eps);
    slope *= u_depth / u_bezel;
    float t1 = atan(abs(slope));
    float t2 = asin(sin(t1) / 1.5);
    float mag = tan(t1 - t2) * (profileHeight(x) + 1.0) * u_depth;
    disp -= dir * mag;
  }
  return disp;
}

vec4 sampleSnap(vec2 pagePos) {
  vec2 uv = pagePos * u_snapScale / u_texSize;
  return texture2D(u_tex, clamp(uv, 0.0, 1.0));
}

vec4 refractedSample(vec2 local, float scale) {
  vec2 pagePos = u_origin + local + displacementAt(local) * scale;
  if (u_frost > 0.05) {
    vec4 acc = sampleSnap(pagePos) * 0.4;
    acc += sampleSnap(pagePos + vec2(u_frost, u_frost * 0.5)) * 0.15;
    acc += sampleSnap(pagePos + vec2(-u_frost, u_frost * 0.5)) * 0.15;
    acc += sampleSnap(pagePos + vec2(u_frost * 0.5, -u_frost)) * 0.15;
    acc += sampleSnap(pagePos + vec2(-u_frost * 0.5, u_frost)) * 0.15;
    return acc;
  }
  return sampleSnap(pagePos);
}

void main() {
  vec2 local = vec2(gl_FragCoord.x, u_canvasH - gl_FragCoord.y) / u_dpr;
  vec4 color;
  if (u_aberration > 0.001) {
    vec4 cr = refractedSample(local, u_refraction * (1.0 - u_aberration * 0.5));
    vec4 cg = refractedSample(local, u_refraction);
    vec4 cb = refractedSample(local, u_refraction * (1.0 + u_aberration * 0.5));
    color = vec4(cr.r, cg.g, cb.b, cg.a);
  } else {
    color = refractedSample(local, u_refraction);
  }
  float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  color.rgb = mix(vec3(luma), color.rgb, u_saturation);
  color.rgb *= u_brightness;
  gl_FragColor = color;
}
`

type RenderMode = 'css' | 'svg' | 'webgl'

export function LiquidGlass({
  children,
  radius = 32,
  bezel = 16,
  profile = 'squircle',
  depth = 64,
  refraction = 1.5,
  magnify = 1.25,
  frost = 2,
  saturation = 2,
  brightness = 2,
  specular = 0.35,
  aberration = 0.25,
  refractSelector,
  invertContent = false,
  tint = 'rgba(255, 255, 255, 0.08)',
  shadow = 0.35,
  elastic = true,
  magnet = true,
  magnetRadius = 1.5,
  className = '',
  style,
}: LiquidGlassProps) {
  const rawId = useId()
  const filterId = `liquid-glass-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [invertMask, setInvertMask] = useState<string | null>(null)
  const [map, setMap] = useState<MapState | null>(null)
  const [mode, setMode] = useState<RenderMode>(() => {
    if (typeof window === 'undefined') return 'css'
    if (supportsSvgBackdrop()) return 'svg'
    const probe = document.createElement('canvas')
    return probe.getContext('webgl') ? 'webgl' : 'css'
  })

  const jelly = useRef({
    scale: 1,
    scaleVelocity: 0,
    scaleTarget: 1,
    squish: 0,
    squishVelocity: 0,
    squishTarget: 0,
    pressing: false,
    frame: 0,
    running: false,
    reducedMotion: false,
  })

  const renderJelly = useCallback(() => {
    const host = hostRef.current
    if (!host) return
    const state = jelly.current
    const sx = state.scale * (1 + state.squish)
    const sy = state.scale * (1 - state.squish)
    host.style.transform = `scale(${sx}, ${sy})`
  }, [])

  const wakeJelly = useCallback(() => {
    const state = jelly.current
    if (state.reducedMotion) {
      state.scale = state.scaleTarget
      state.squish = state.squishTarget
      renderJelly()
      return
    }
    if (state.running) return
    state.running = true

    const tick = () => {
      if (state.pressing) {
        state.scale += (state.scaleTarget - state.scale) * JELLY_PRESS_EASE
        state.squish += (state.squishTarget - state.squish) * JELLY_PRESS_EASE
        state.scaleVelocity = 0
        state.squishVelocity = 0
      } else {
        state.scaleVelocity =
          (state.scaleVelocity +
            (state.scaleTarget - state.scale) * JELLY_RELEASE_STIFFNESS) *
          JELLY_RELEASE_DAMPING
        state.scale += state.scaleVelocity
        state.squishVelocity =
          (state.squishVelocity +
            (state.squishTarget - state.squish) * JELLY_RELEASE_STIFFNESS) *
          JELLY_RELEASE_DAMPING
        state.squish = clamp(state.squish + state.squishVelocity, -0.3, 0.3)
      }
      renderJelly()

      const settled =
        Math.abs(state.scaleVelocity) < 0.0005 &&
        Math.abs(state.scaleTarget - state.scale) < 0.0005 &&
        Math.abs(state.squishVelocity) < 0.0005 &&
        Math.abs(state.squishTarget - state.squish) < 0.0005

      if (settled) {
        state.scale = state.scaleTarget
        state.squish = state.squishTarget
        renderJelly()
        state.running = false
        return
      }
      state.frame = requestAnimationFrame(tick)
    }

    state.frame = requestAnimationFrame(tick)
  }, [renderJelly])

  useEffect(() => {
    const state = jelly.current
    state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return () => {
      cancelAnimationFrame(state.frame)
      state.running = false
    }
  }, [])

  const setPressed = useCallback(
    (next: boolean) => {
      if (!elastic) return
      const state = jelly.current
      const wasPressing = state.pressing
      state.pressing = next
      state.scaleTarget = next ? JELLY_PRESS_SCALE : 1
      state.squishTarget = next ? JELLY_SQUISH : 0
      if (next) {
        state.scaleVelocity = 0
        state.squishVelocity = 0
      } else if (wasPressing) {
        state.scaleVelocity = JELLY_RELEASE_SCALE_KICK
        state.squishVelocity = -JELLY_RELEASE_SQUISH_KICK
      }
      wakeJelly()
    },
    [elastic, wakeJelly],
  )

  useEffect(() => {
    if (!elastic) return
    const onUp = () => {
      if (jelly.current.pressing) setPressed(false)
    }
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [elastic, setPressed])

  const glProps = useRef({
    radius,
    bezel,
    profile,
    depth,
    refraction,
    magnify,
    frost,
    saturation,
    brightness,
    aberration,
  })
  const glDrawRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    glProps.current = {
      radius,
      bezel,
      profile,
      depth,
      refraction,
      magnify,
      frost,
      saturation,
      brightness,
      aberration,
    }
    glDrawRef.current?.()
  })

  useEffect(() => {
    if (!invertContent) {
      return
    }
    const host = hostRef.current
    const content = contentRef.current
    if (!host || !content) return

    let disposed = false
    let timer: number | undefined

    const rasterize = async () => {
      try {
        const { default: html2canvas } = await import('html2canvas-pro')
        const snap = await html2canvas(content, {
          backgroundColor: null,
          scale: Math.min(window.devicePixelRatio || 1, 2),
          logging: false,
          onclone: (_doc, cloned) => {
            cloned.style.setProperty('color', '#fff', 'important')
            for (const el of Array.from(cloned.querySelectorAll<HTMLElement>('*'))) {
              el.style.setProperty('color', '#fff', 'important')
            }
          },
        })
        if (!disposed) setInvertMask(snap.toDataURL())
      } catch {
        if (!disposed) setInvertMask(null)
      }
    }

    const schedule = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void rasterize(), 150)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(host)
    void rasterize()

    return () => {
      disposed = true
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [invertContent])

  useEffect(() => {
    if (mode !== 'svg') return
    const host = hostRef.current
    if (!host) return

    let frame = 0
    let lastW = 0
    let lastH = 0

    const rebuild = () => {
      const rect = host.getBoundingClientRect()
      const w = Math.round(rect.width)
      const h = Math.round(rect.height)
      if (w < 2 || h < 2 || (w === lastW && h === lastH)) return
      lastW = w
      lastH = h
      const clampedBezel = Math.max(2, Math.min(bezel, w / 2, h / 2))
      const magnitudes = traceProfile(PROFILES[profile] ?? PROFILES.squircle, clampedBezel, depth)
      const built = buildDisplacementMap(w, h, radius, clampedBezel, magnify, magnitudes)
      if (built) setMap({ ...built, width: w, height: h })
    }

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(rebuild)
    })
    observer.observe(host)
    rebuild()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [mode, radius, bezel, profile, depth, magnify])

  useEffect(() => {
    if (mode !== 'webgl') return
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return

    const gl = canvas.getContext('webgl', { premultipliedAlpha: true })
    if (!gl) {
      setMode('css')
      return
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
      }
      return shader
    }
    const vert = compile(gl.VERTEX_SHADER, GL_VERT)
    const frag = compile(gl.FRAGMENT_SHADER, GL_FRAG)
    const program = vert && frag ? gl.createProgram() : null
    if (!vert || !frag || !program) {
      if (vert) gl.deleteShader(vert)
      if (frag) gl.deleteShader(frag)
      if (program) gl.deleteProgram(program)
      setMode('css')
      return
    }
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)
    gl.deleteShader(vert)
    gl.deleteShader(frag)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      setMode('css')
      return
    }
    gl.useProgram(program)

    const quad = gl.createBuffer()
    if (!quad) {
      gl.useProgram(null)
      gl.deleteProgram(program)
      setMode('css')
      return
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const u = (name: string) => gl.getUniformLocation(program, name)
    const loc = {
      texSize: u('u_texSize'),
      snapScale: u('u_snapScale'),
      origin: u('u_origin'),
      size: u('u_size'),
      dpr: u('u_dpr'),
      canvasH: u('u_canvasH'),
      radius: u('u_radius'),
      bezel: u('u_bezel'),
      depth: u('u_depth'),
      profile: u('u_profile'),
      refraction: u('u_refraction'),
      magnify: u('u_magnify'),
      frost: u('u_frost'),
      saturation: u('u_saturation'),
      brightness: u('u_brightness'),
      aberration: u('u_aberration'),
    }

    let disposed = false
    let frame = 0
    const cleanupExtras: Array<() => void> = []
    let texture: WebGLTexture | null = null
    let texSize: [number, number] = [1, 1]
    let snapScale = 1
    let snapTimer: number | undefined

    const source = refractSelector
      ? (document.querySelector(refractSelector) as
          | HTMLImageElement
          | HTMLCanvasElement
          | HTMLVideoElement
          | null)
      : null
    const sourceIsLive =
      source instanceof HTMLCanvasElement || source instanceof HTMLVideoElement

    const uploadSource = () => {
      if (disposed || !source) return
      const sw =
        source instanceof HTMLVideoElement
          ? source.videoWidth
          : source instanceof HTMLImageElement
            ? source.naturalWidth
            : source.width
      const sh =
        source instanceof HTMLVideoElement
          ? source.videoHeight
          : source instanceof HTMLImageElement
            ? source.naturalHeight
            : source.height
      if (sw < 1 || sh < 1) return
      try {
        texture = texture ?? gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        texSize = [sw, sh]
        const srcRect = source.getBoundingClientRect()
        snapScale = srcRect.width > 0 ? sw / srcRect.width : 1
      } catch {
        if (texture) gl.deleteTexture(texture)
        texture = null
      }
    }

    const draw = () => {
      if (disposed || !texture) return
      const rect = host.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(rect.width * dpr))
      const h = Math.max(1, Math.round(rect.height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      const p = glProps.current
      gl.viewport(0, 0, w, h)
      gl.uniform2f(loc.texSize, texSize[0], texSize[1])
      gl.uniform1f(loc.snapScale, snapScale)
      if (source) {
        const srcRect = source.getBoundingClientRect()
        gl.uniform2f(loc.origin, rect.left - srcRect.left, rect.top - srcRect.top)
      } else {
        gl.uniform2f(loc.origin, rect.left + window.scrollX, rect.top + window.scrollY)
      }
      gl.uniform2f(loc.size, rect.width, rect.height)
      gl.uniform1f(loc.dpr, dpr)
      gl.uniform1f(loc.canvasH, h)
      gl.uniform1f(loc.radius, Math.min(p.radius, rect.width / 2, rect.height / 2))
      gl.uniform1f(loc.bezel, Math.max(2, Math.min(p.bezel, rect.width / 2, rect.height / 2)))
      gl.uniform1f(loc.depth, p.depth)
      gl.uniform1i(loc.profile, p.profile === 'circle' ? 1 : p.profile === 'lip' ? 2 : 0)
      gl.uniform1f(loc.refraction, p.refraction)
      gl.uniform1f(loc.magnify, Math.max(p.magnify, 1))
      gl.uniform1f(loc.frost, p.frost)
      gl.uniform1f(loc.saturation, p.saturation)
      gl.uniform1f(loc.brightness, p.brightness)
      gl.uniform1f(loc.aberration, p.aberration)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    glDrawRef.current = draw

    const schedule = () => {
      if (disposed) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(draw)
    }

    const snapshot = async () => {
      try {
        const { default: html2canvas } = await import('html2canvas-pro')
        if (disposed) return
        const snap = await html2canvas(document.body, {
          backgroundColor: null,
          scale: Math.min(window.devicePixelRatio || 1, 2),
          logging: false,
          ignoreElements: (element) => element === host || host.contains(element),
        })
        if (disposed) return
        texture = texture ?? gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, snap)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        texSize = [snap.width, snap.height]
        snapScale = snap.width / Math.max(1, document.body.scrollWidth)
        schedule()
      } catch {
        if (!disposed) setMode('css')
      }
    }

    const requestSnapshot = () => {
      window.clearTimeout(snapTimer)
      snapTimer = window.setTimeout(() => void snapshot(), 250)
    }

    const onScroll = () => schedule()
    const onResize = () => {
      schedule()
      requestSnapshot()
    }
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    window.addEventListener('resize', onResize)
    const observer = new ResizeObserver(schedule)
    observer.observe(host)

    if (source) {
      if (sourceIsLive) {
        let running = true
        const loop = () => {
          if (disposed || !running) return
          uploadSource()
          draw()
          frame = requestAnimationFrame(loop)
        }
        const io = new IntersectionObserver(([entry]) => {
          const next = entry.isIntersecting
          if (next && !running) {
            running = true
            loop()
          } else if (!next) {
            running = false
          }
        })
        io.observe(host)
        loop()
        cleanupExtras.push(() => io.disconnect())
      } else if (source instanceof HTMLImageElement && !source.complete) {
        const onLoad = () => {
          uploadSource()
          schedule()
        }
        source.addEventListener('load', onLoad)
        cleanupExtras.push(() => source.removeEventListener('load', onLoad))
      } else {
        uploadSource()
        schedule()
      }
    } else {
      void snapshot()
    }

    return () => {
      disposed = true
      glDrawRef.current = null
      cancelAnimationFrame(frame)
      window.clearTimeout(snapTimer)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      observer.disconnect()
      for (const cleanup of cleanupExtras) cleanup()
      gl.useProgram(null)
      gl.bindBuffer(gl.ARRAY_BUFFER, null)
      gl.disableVertexAttribArray(aPos)
      gl.deleteBuffer(quad)
      if (texture) {
        gl.bindTexture(gl.TEXTURE_2D, null)
        gl.deleteTexture(texture)
      }
      gl.deleteProgram(program)
    }
  }, [mode, refractSelector])

  const useSvgFilter = mode === 'svg' && map !== null
  const backdropFilter =
    mode === 'webgl'
      ? undefined
      : useSvgFilter
        ? `url(#${filterId})`
        : `blur(${Math.max(frost, 6)}px) saturate(${saturation}) brightness(${brightness})`

  const rimOpacity = Math.min(Math.max(specular, 0), 1)
  const pane = (
    <div
      ref={hostRef}
      className={`relative isolate will-change-transform ${className}`}
      style={{
        borderRadius: radius,
        boxShadow: shadow > 0 ? `0 18px 40px -16px rgba(0, 0, 0, ${0.9 * shadow})` : undefined,
        ...style,
      }}
      onPointerDown={elastic ? () => setPressed(true) : undefined}
    >
      {useSvgFilter && (
        <svg aria-hidden="true" width={0} height={0} className="absolute" colorInterpolationFilters="sRGB">
          <defs>
            <filter
              id={filterId}
              x={0}
              y={0}
              width={map.width}
              height={map.height}
              filterUnits="userSpaceOnUse"
              primitiveUnits="userSpaceOnUse"
            >
              <feImage
                href={map.url}
                x={0}
                y={0}
                width={map.width}
                height={map.height}
                result="map"
              />
              {aberration > 0 ? (
                <>
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="map"
                    scale={map.maxDisplacement * refraction * (1 - aberration * 0.5)}
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="dispRed"
                  />
                  <feColorMatrix
                    in="dispRed"
                    type="matrix"
                    values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                    result="red"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="map"
                    scale={map.maxDisplacement * refraction}
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="dispGreen"
                  />
                  <feColorMatrix
                    in="dispGreen"
                    type="matrix"
                    values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                    result="green"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="map"
                    scale={map.maxDisplacement * refraction * (1 + aberration * 0.5)}
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="dispBlue"
                  />
                  <feColorMatrix
                    in="dispBlue"
                    type="matrix"
                    values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                    result="blue"
                  />
                  <feComposite
                    in="red"
                    in2="green"
                    operator="arithmetic"
                    k1="0"
                    k2="1"
                    k3="1"
                    k4="0"
                    result="redGreen"
                  />
                  <feComposite
                    in="redGreen"
                    in2="blue"
                    operator="arithmetic"
                    k1="0"
                    k2="1"
                    k3="1"
                    k4="0"
                    result="refracted"
                  />
                </>
              ) : (
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="map"
                  scale={map.maxDisplacement * refraction}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="refracted"
                />
              )}
              <feGaussianBlur in="refracted" stdDeviation={frost} result="frosted" />
              <feColorMatrix in="frosted" type="saturate" values={`${saturation}`} result="graded" />
              <feComponentTransfer in="graded">
                <feFuncR type="linear" slope={brightness} />
                <feFuncG type="linear" slope={brightness} />
                <feFuncB type="linear" slope={brightness} />
              </feComponentTransfer>
            </filter>
          </defs>
        </svg>
      )}
      {mode === 'webgl' && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full"
          style={{ borderRadius: radius }}
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          borderRadius: radius,
          backdropFilter,
          WebkitBackdropFilter: backdropFilter,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          borderRadius: radius,
          backgroundColor: tint,
          filter: `brightness(${brightness})`,
        }}
      />
      {rimOpacity > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            borderRadius: radius,
            padding: 1.5,
            opacity: rimOpacity,
            background:
              'linear-gradient(115deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.12) 28%, rgba(255,255,255,0) 46%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.35) 78%, rgba(255,255,255,0.75) 100%)',
            WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            mask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)',
          }}
        />
      )}
      {rimOpacity > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            borderRadius: radius,
            opacity: rimOpacity,
            boxShadow:
              'inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -8px 24px -12px rgba(255,255,255,0.25)',
          }}
        />
      )}
      {invertContent && invertMask && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: radius,
            backdropFilter: 'invert(1)',
            WebkitBackdropFilter: 'invert(1)',
            maskImage: `url(${invertMask})`,
            WebkitMaskImage: `url(${invertMask})`,
            maskSize: '100% 100%',
            WebkitMaskSize: '100% 100%',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
          }}
        />
      )}
      <div
        ref={contentRef}
        className={`relative ${invertContent ? 'text-transparent! **:text-transparent!' : ''}`}
      >
        {children}
      </div>
    </div>
  )

  if (!magnet) return pane

  return (
    <Magnet
      radius={magnetRadius}
      pullFactor={0.4}
      tiltStrength={0}
      glare={false}
      lift={1.015}
      stiffness={0.1}
      damping={0.78}
      wrapperClassName="inline-block max-w-full"
      innerClassName="rounded-[inherit]"
      style={{ borderRadius: radius }}
    >
      {pane}
    </Magnet>
  )
}

export default LiquidGlass
