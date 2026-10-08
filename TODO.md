# Current work

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

- [ ] Initialize `components.json` and install required dependencies (`html2canvas-pro`, Tailwind CSS tooling).
- [ ] Install `IsometricButton` under `src/components/ui/button/IsometricButton/` (`IsometricButton.tsx`, `IsometricButton.css`, `index.ts`).
- [ ] Install `Magnet` effect under `src/components/effects/Magnet/` (`Magnet.tsx`, `index.ts`).
- [ ] Install `LiquidGlass` effect under `src/components/effects/LiquidGlass/` (`LiquidGlass.tsx`, `index.ts`).
- [ ] Install `SpringSelect` control under `src/components/ui/select/SpringSelect/` (`SpringSelect.tsx`, `index.ts`).
- [ ] Install `SpringSlider` control under `src/components/ui/slider/SpringSlider/` (`SpringSlider.tsx`, `index.ts`).
- [ ] Install `SpringAccordion` control under `src/components/ui/accordion/SpringAccordion/` (`SpringAccordion.tsx`, `index.ts`).
- [ ] Create minimal usage examples for all 6 components (`src/components/examples/` or dedicated preview).
- [ ] Run typecheck (`npm run typecheck`), build (`npm run build`), and test suite (`npx playwright test`).
- [ ] Commit and push to GitHub repository.

## Accepted limitations

The exact wallpaper asset and font were not supplied; the local SVG and Arial are approved approximations. Mobile stacking is an approved adaptation. Backend authentication, validation, recovery, database, protected routes, and deployment are intentionally deferred.
