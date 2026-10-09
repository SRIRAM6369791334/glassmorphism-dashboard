# Current project context

## Current delivery - 2026-10-09

The user authorized the backend/authentication foundation in the sibling `D:/UI Project/MY Dashborad Glass morfisam api`. **All Docker work remains deferred until the final stage.** React/Vite/npm, the glass UI, effects and public gallery are preserved. Login now accepts email. `authApi.ts` connects signup, verification, login, refresh, logout/logout-all and the existing recovery modal. Access/reset tokens stay in memory; rotating refresh uses an HttpOnly cookie. No domain dashboard is invented.

Backend: NestJS modular monolith, Prisma/MySQL 8, 13 core tables, Redis limits/coordination, BullMQ/outbox, Argon2id, transactional OTP/session flows, RBAC, request IDs, safe errors and health/metrics. Isolated native MySQL 8.4.10 on 3307 and Redis 8.0.6 in Kali WSL on 6380 are configured; existing XAMPP 3306 is untouched. Backend `.env`/`.local` are ignored. No external email or deployment. Actual test evidence is recorded in `docs/ui/verification.md` and the sibling API's `docs/handoff.md`.

Earlier context below records historical UI delivery; its static boundary and proposed next work are superseded by this section and `docs/architecture/backend-integration-plan.md`.

Updated: 2026-10-08. Status: Upgraded Password Recovery to full 4-step Email OTP verification flow (`RecoveryModal`): Step 1 (email entry), Step 2 (6-digit frosted glass OTP code boxes with auto-advance, backspace, paste, and active resend timer), Step 3 (Set New Password with dual inputs and reveal toggle), and Step 4 (glowing success confirmation). All test receipts and visual preview captures strictly directed to `artifacts/preview/`. All 15 Chromium tests passing 100%. Strict TypeScript and ESLint passing with 0 errors.

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
