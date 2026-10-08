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

### Refined

- Varied central wallpaper facets after screenshot review showed that broad uniform geometry appeared flat behind the glass.
- Optimized RAF animation loops to suspend when quiescent, preventing CPU throttling and test timeouts across software-rendered WebKit on Windows.
- Standardized cross-browser test timeouts and stacking contexts for deterministic hit-testing.

### Verification

Complete pipeline (`npm run check`) fully verified:
- `npm run lint`: passed with 0 errors.
- `npm run build`: built in 363ms with strict TypeScript type checking.
- `npm run test:e2e`: all 42 tests passed across Chromium, Firefox, and WebKit engines.

