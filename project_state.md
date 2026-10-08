# Project State Memory

Last Updated: 2026-10-08T15:35:00+05:30
Repository: `https://github.com/SRIRAM6369791334/glassmorphism-dashboard`
Active Branch: `main`

---

## 1. System Overview
- **Core Technology**: React 19.3.0, TypeScript 6.0.3, Vite 8.3.3, CSS Modules, Tailwind CSS integration ready.
- **Verification Engine**: Playwright 1.64.0 (28 active tests passing on Chromium & Firefox), ESLint 10.12.0.
- **Active Route**: `/` renders `AuthScreen` (Login / Register view transition, glassmorphism card, geometry wallpaper).

---

## 2. Active Components & Visual Systems
1. **Interactive Glass Card**:
   - `cardGlowBorder`: Cursor-proximity specular radial glow following pointer coordinates.
   - `cardSpecularSpot`: Soft ambient radial spotlight behind glass.
   - `inputBox`: Frosted glass capsule with neon purple glowing border on focus/touch.
2. **Dynamic Cursor System**:
   - `CursorProvider` & `CursorContext`: Global cursor abstraction.
   - `ParticlesCursor`: 1000-particle canvas trail with momentum physics and automatic quiescent pause.
3. **DesignPass.dev Spring Physics Suite**:
   - `src/components/ui/button/IsometricButton/`
   - `src/components/ui/select/SpringSelect/`
   - `src/components/ui/slider/SpringSlider/`
   - `src/components/ui/accordion/SpringAccordion/`
   - `src/components/effects/LiquidGlass/`
   - `src/components/effects/Magnet/`
4. **Dedicated Component Gallery & Extensible Registry**:
   - `src/pages/ComponentsGalleryPage.tsx`: Interactive gallery for all 19 components with real-time search, category filters, live previews, and code copying.
   - `src/registry/components.tsx`: Central extensible registry for auto-registering any future components.
   - `#/components` route and floating switcher pill on `AuthScreen`.

---

## 3. Verification Metrics & Receipts
- **Lint**: 0 warnings, 0 errors (`npm run lint`).
- **Build**: Vite production build succeeded in ~760ms (JS: 316.55 kB gzip: 97.60 kB; CSS: 64.45 kB).
- **Playwright Tests**: 28 passed across Chromium and Firefox.

---

## 4. Immediate Roadmap & Trajectory
1. [x] Documentation sync across all core `.md` files.
2. [x] Configure `components.json` and install dependencies.
3. [x] Scaffold and populate dedicated directories for all DesignPass components.
4. [x] Build extensible Component Registry (`src/registry/components.tsx`) and dedicated `ComponentsGalleryPage` (`src/pages/ComponentsGalleryPage.tsx`).
5. [x] Run lint, typecheck, build, and test validation.
6. [x] Connect hash routing (`#/components`) and floating navigation switcher.
