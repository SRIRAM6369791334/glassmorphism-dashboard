# Current project context

Updated: 2026-10-08. Status: Desktop scrollbar eliminated (perfect 100svh centering); showcase section removed while preserving cursor particles, specular border glow, and input focus neon glow. Active task: Installing and organizing 5 DesignPass.dev components + Magnet into modular folder hierarchies with `components.json` and usage examples. All 28 Playwright tests currently passing on Chromium and Firefox.

## Purpose and scope

A production-grade, reference-based glassmorphism authentication experience evolving into an extensible dashboard UI system. The project now incorporates:
1. High-frequency particle physics cursor (`ParticlesCursor`)
2. Specular card border glow and mouse proximity lighting
3. DesignPass.dev spring-physics and 3D controls:
   - `IsometricButton` (pure CSS 3D prism with floor reflection and spring bounce)
   - `LiquidGlass` (Apple-style optical refraction with WebGL/SVG fallbacks and jelly squish)
   - `Magnet` (cursor attraction with aspect-ratio travel and 3D tilt)
   - `SpringSelect` (spring-opened dropdown with search, keyboard typeahead, and magnetic trigger)
   - `SpringSlider` (channel-style velocity squash slider with real-time readout)
   - `SpringAccordion` (spring-height disclosure list with fluid physics)

## Stack and structure

- **Core**: React 19.3.0, TypeScript 6.0.3, Vite 8.3.3, CSS Modules + Tailwind CSS utility support, ESLint 10.12.0, Playwright 1.64.0.
- **Component Folder Architecture**:
  - `src/components/ui/button/IsometricButton/`
  - `src/components/ui/select/SpringSelect/`
  - `src/components/ui/slider/SpringSlider/`
  - `src/components/ui/accordion/SpringAccordion/`
  - `src/components/effects/LiquidGlass/`
  - `src/components/effects/Magnet/`
  - `src/components/cursors/` (`ParticlesCursor`, `CursorProvider`, `CursorContext`)
  - `src/components/lightswind/` (`GlowingCards`, `GlowingCard`)
  - `src/features/auth/` (`AuthScreen`, `AuthForm`, `WelcomePanel`, `useAuthTransition`)
  - `src/styles/` (`global.css`, design tokens)

## Boundaries and next work

1. Configure `components.json` and install peer dependencies (`html2canvas-pro`, Tailwind CSS tooling).
2. Install the 5 DesignPass components + `Magnet` in dedicated, modular directories.
3. Build concise, standalone minimal usage examples for all 6 components.
4. Verify strict type-safety (`npm run build`), linting (`npm run lint`), and zero regression on existing auth tests.
5. Continuously synchronize all project documentation files (`CHANGELOG.md`, `TODO.md`, `DECISIONS.md`, `LESSONS_LEARNED.md`, `project_state.md`).
