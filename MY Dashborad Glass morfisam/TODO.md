# Current work

## Authentication foundation - 2026-10-09

- [x] Inspect frontend and preserve existing UI/framework and uncommitted recovery work.
- [x] Build sibling backend, 13-table migration, authentication/security/session/outbox foundation.
- [x] Connect forms and OTP/recovery with safe feedback and idempotency.
- [x] Verify real MySQL/Redis/BullMQ/local SMTP auth flows.
- [ ] Complete final cross-browser verification/handoff (see current test evidence).
- [ ] Production capacity/load tests, real provider configuration and operational deployment checks.
- [ ] Docker work only at the final stage; explicitly deferred.

Earlier static-scope limitations below are historical and superseded by the authorized backend brief.

Purpose: track concrete incomplete tasks. Longer-term possibilities belong in [ROADMAP.md](ROADMAP.md).

## Static authentication delivery

- [x] Read requirements and analyze screenshots and recording.
- [x] Create the requested documentation framework and five prompt templates before application code.
- [x] Record architecture, component design, tokens, motion, and responsive choices.
- [x] Initialize React, TypeScript, Vite, CSS Modules, ESLint, and Playwright with a lockfile.
- [x] Implement local wallpaper, card, shared controls, Login, and registration.
- [x] Implement transitions, heading focus, password visibility, reduced motion, and static notices.
- [x] Pass initial type check, lint, and production build.
- [x] Inspect desktop/mobile screenshots and refine the wallpaper's central geometry.
- [x] Confirm the complete Chromium and Firefox Playwright test suite (28/28 passing).
- [x] Remove showcase card section from AuthScreen without regressing animations.
- [x] Eliminate desktop vertical/horizontal scrollbar (0px overflow at 1440x900).
- [x] Synchronize documentation files (`AI_CONTEXT.md`, `CHANGELOG.md`, `TODO.md`, `DECISIONS.md`, `LESSONS_LEARNED.md`, `project_state.md`).

## DesignPass.dev Components Integration

- [x] Initialize `components.json` and install required dependencies (`html2canvas-pro`, Tailwind CSS tooling).
- [x] Install `IsometricButton` under `src/components/ui/button/IsometricButton/` (`IsometricButton.tsx`, `IsometricButton.css`, `index.ts`).
- [x] Install `Magnet` effect under `src/components/effects/Magnet/` (`Magnet.tsx`, `index.ts`).
- [x] Install `LiquidGlass` effect under `src/components/effects/LiquidGlass/` (`LiquidGlass.tsx`, `index.ts`).
- [x] Install `SpringSelect` control under `src/components/ui/select/SpringSelect/` (`SpringSelect.tsx`, `index.ts`).
- [x] Install `SpringSlider` control under `src/components/ui/slider/SpringSlider/` (`SpringSlider.tsx`, `index.ts`).
- [x] Install `SpringAccordion` control under `src/components/ui/accordion/SpringAccordion/` (`SpringAccordion.tsx`, `index.ts`).
- [x] Create minimal usage examples for all 6 components (`src/components/examples/` or dedicated preview).
- [x] Create dedicated Component Gallery page (`src/pages/ComponentsGalleryPage.tsx`) showcasing all 19 components with real-time search, filters, and code copying.
- [x] Establish centralized extensible Component Registry (`src/registry/components.tsx`).
- [x] Connect hash routing (`#/components`) and floating navigation switcher.
- [x] Upgrade all auth action buttons (`Login`, `Create Account`, `Sign in`, `Sign Up`) to `IsometricButton`.
- [x] Transform input fields (`Username`, `Password`, `Full Name`, `Work Email`) into 3D Glass Prism inputs.
- [x] Re-engineer `IsometricButton` tilt (`rotateX: 30deg`, `standAngle: 0deg`, `thickness: 18px`, `edgeColor: #261c36`) to project 3D depth towards the downside.
- [x] Implement 3D Typography (Ideas 1, 3, 4): 3D Block Extrusion headings, 3D Raised Metallic Bevel button text, and Glass Engraved tactile field text & icons.
- [x] Implement persistent 3D border light effect & floor glow on filled input fields (keeps illuminating when value is present, even without hover/focus).
- [x] Fix browser autofill / autocomplete suggestion background artifact to ensure seamless glass transparency without opaque box-shadow.
- [x] Deploy custom matching `ShimmerText` animation strictly to targeted brand text (`WELCOME BACK!`, `Create Account`, `Full Name`, `Login`, `HELLO, FRIEND!`).
- [x] Eliminate text button hover/touch background box artifact by decoupling `<GlassButton variant="text">` from `.glass` pill styles, ensuring 0px background and 0px box-shadow.
- [x] Enhance subtitles (`.welcome p`) and footer prompts (`.formFooter p`) with Frosted Silk Dual-Tone Gradient typography and ambient glow.
- [x] Implement interactive password recovery popup modal (`RecoveryModal`) with 4-step Email OTP flow (Email verification -> 6-Digit Glass OTP inputs with timer -> New & Confirm Password -> Success confirmation screen with checkmark).
- [x] Route all visual verification screenshots and test receipts directly into `artifacts/preview/` per project standards.
- [x] Run typecheck (`npm run typecheck`), build (`npm run build`), and test suite (`npm run test:e2e` - 15/15 Chromium tests passing with dedicated recovery modal test).
- [x] Commit and push to GitHub repository (`origin/main`).

## Accepted limitations

The exact wallpaper asset and font were not supplied; the local SVG and Arial are approved approximations. Mobile stacking is an approved adaptation. Backend authentication, validation, recovery, database, protected routes, and deployment are intentionally deferred.
