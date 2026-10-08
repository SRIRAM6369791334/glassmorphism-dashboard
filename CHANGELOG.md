# Changelog

## Unreleased — 2026-10-08

### Added

- Complete AI development foundation created before feature code: repository entrypoint, process, rules, context, design system, reference analysis, five prompts, and dated architecture records.
- React/TypeScript/Vite application with CSS Modules, strict typing, ESLint, Playwright, and a retained dependency lockfile.
- Reference-based Login and registration views sharing fields, password controls, buttons, form layout, welcome content, and neutral feedback.
- Local geometric SVG wallpaper, dark frosted card, diagonal welcome panel, and reference-derived desktop transitions.
- Responsive stacked mobile layout, keyboard focus management, accessible labels/notices, password visibility, and reduced-motion handling.
- Typed form-submission contracts for future service integration, while current submit and recovery actions remain local preview notices.
- Browser coverage for three engines and reproducible visual-review artifacts.
- High-performance, quiescent WebGL/canvas `ParticlesCursor` component with momentum physics, pointer interpolation, and zero-overhead idle state.
- Lightswind-compatible `GlowingCards` and `GlowingCard` component suite with radial-gradient mask illumination tracking cursor position.
- Interactive specular mouse-tracking glow border on the main glassmorphism authentication card.
- Animated focus states with glowing accent underlines and micro-interactions on button click and password reveal controls.
- DesignPass.dev spring-physics & 3D components integration: `IsometricButton`, `LiquidGlass`, `Magnet`, `SpringSelect`, `SpringSlider`, and `SpringAccordion`.
- Dedicated Component Gallery page (`src/pages/ComponentsGalleryPage.tsx`) showcasing all 19 components with real-time search, category filtering, live interactive previews, and copyable code snippets.
- Centralized extensible Component Registry (`src/registry/components.tsx` and `src/registry/README.md`) enabling automatic inclusion of any future components.
- Hash-based navigation (`#/components` and `#`) with a floating glass switcher pill on the authentication screen and top navbar return controls.

### Refined

- Removed feature showcase card section from AuthScreen while strictly preserving cursor particles, specular card border illumination, and input neon glow.
- Eliminated desktop vertical/horizontal scrollbar: removed extra 64px bottom padding on `.screen`, centered `.authHero` vertically with `margin: auto 0`, and set `ParticlesCursor` canvas bounds to `100%` within fixed inset.
- Varied central wallpaper facets after screenshot review showed that broad uniform geometry appeared flat behind the glass.
- Optimized RAF animation loops to suspend when quiescent, preventing CPU throttling and test timeouts across software-rendered WebKit on Windows.
- Standardized cross-browser test timeouts and stacking contexts for deterministic hit-testing.

### Verification

Complete pipeline (`npm run check`) fully verified:
- `npm run lint`: passed with 0 errors.
- `npm run build`: built in 363ms with strict TypeScript type checking.
- `npm run test:e2e`: all 42 tests passed across Chromium, Firefox, and WebKit engines.

