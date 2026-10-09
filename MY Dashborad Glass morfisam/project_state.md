# Project State Memory

## Current state - 2026-10-09

Frontend auth is API-connected with preserved styling; sibling backend contains NestJS/Prisma/MySQL/Redis/BullMQ authentication and 13 core tables. Native local services are isolated from XAMPP. Backend unit and real-service integration checks have passed; final browser validation and handoff are tracked in docs/ui/verification.md and sibling docs/handoff.md. No domain features or deployment. Docker deferred to the final stage. Prior entries below preserve UI history.

Last Updated: 2026-10-08T18:40:00+05:30
Repository: `(Pending new GitHub repository)`
Active Branch: `main`

---

## 1. System Overview
- **Core Technology**: React 19.3.0, TypeScript 6.0.3, Vite 8.3.3, CSS Modules, Tailwind CSS integration ready.
- **Verification Engine**: Playwright 1.64.0 (42 tests passing 100% across Chromium, Firefox, WebKit), ESLint 10.12.0.
- **Active Routes**: 
  - `/` renders `AuthScreen` (Login / Register view transition, 3D buttons & 3D inputs, glass card, geometry wallpaper).
  - `#/components` renders `ComponentsGalleryPage` (all 19 project components with search, filters, and code copying).

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
5. **IsometricButton Auth Integration with Downside 3D Extrusion**:
   - `Login` and `Sign Up` submit buttons in `AuthForm.tsx` powered by 3D `IsometricButton`.
   - `Create Account` and `Sign in` mode-switching buttons in `WelcomePanel.tsx` powered by 3D `IsometricButton`.
   - Settings configured for downside projection: `rotateX: 30deg`, `standAngle: 0deg`, `thickness: 18px`, `gapRest: 12px`, `edgeColor: #261c36` with bottom slice shadow and top-face bottom bevel.
6. **3D Glass Prism Input Fields with Persistent Glow on Fill**:
   - `Username`, `Password`, `Full Name`, and `Work Email` inputs upgraded with extruded 3D bevels, subtle perspective elevation, and glowing neon purple floor reflections.
   - **Persistent Illumination**: Fields stay vibrantly glowing with purple neon border illumination, top highlight edge, and floor glow once filled with user input (via both CSS `:has(input:not(:placeholder-shown))` and `data-filled="true"`), even when blurred or unhovered.
   - **Transparent Autofill / Autocomplete**: Browser suggestions / autofill entries render with 100% transparency without ugly opaque grey box-shadow patches behind text.
7. **Comprehensive 3D Typography Suite (Ideas 1, 3, 4)**:
   - **3D Block Extrusion Headings**: `HELLO, FRIEND!`, `WELCOME BACK!`, `Login`, and `Create Account` with 7-layer stacked downward 3D shadows and neon purple underglow.
   - **3D Raised Metallic Bevel Button Labels**: Raised 3D bevel text-shadows on all `IsometricButton` labels with click-press compression.
   - **3D Glass Engraved / Inset Field Text & Icons**: Subtle dual-tone engraved 3D shadows on input values, placeholders, field icons, and footer links.
8. **Target-Scoped `ShimmerText` Animation with Custom Matching Color**:
   - Sweeping light shimmer gradient (`#ffffff` base with `#e9d5ff` -> `#c084fc` -> `#f5d0fe` lavender-purple neon sheen) deployed strictly across requested brand elements:
     - Headings: `WELCOME BACK!`, `HELLO, FRIEND!`, `Login`, and `Create Account`.
     - Buttons: `Login` and `Create Account`.
     - Fields: `Full Name` placeholder overlay (smoothly fades on focus or fill).
   - All other fields, helper text, and secondary copy remain in their clean 3D tactile states.
9. **Zero-Box Pure Text Switcher Links & Ghost Recovery Link**:
   - `Sign Up` and `Login` inline switcher links decoupled from `.glass` pill styles, removing unwanted rectangular translucent background box on hover/touch.
   - Enhanced with glowing lavender-purple typography (`#c084fc` -> `#f3e8ff`), zero border/background/box-shadow, and an animated neon purple gradient bottom underline (`::after`).
   - `Forgot Password?` styled as a soft ghost amethyst link with gentle purple text-glow on hover, completely free of background box or underline.
10. **Frosted Silk Dual-Tone Gradient Subtitles & Prompts**:
    - `.welcome p` ("Enter your personal details...", "Already a Member? Please Login...") and `.formFooter p` ("Don't have an account?", "Already a Member?") rendered with dual-tone gradient fill (`#f8fafc` -> `#cbd5e1` -> `#94a3b8`) and subtle purple ambient drop shadow, elevating typographic hierarchy.
11. **Interactive Password Recovery & Signup Email OTP Verification System (`RecoveryModal`)**:
    - Accessible frosted glass dialog (`role="dialog"`, `aria-modal="true"`) launched by clicking/touching "Forgot Password?" or submitting the Register form.
    - End-to-end multi-step flow with live backend API integration:
      - **Step 1 (Email)**: 3D Glass Prism email input field (`Field label="Registered Email" type="email" icon="mail"`), floating label, and 3D `IsometricButton` ("Send OTP Code").
      - **Step 2 (OTP)**: 6 individual frosted glass OTP input boxes with auto-focus advance, backspace navigation, numeric sanitization, paste support, active 60s countdown timer ("Resend OTP in 60s"), one-click local mail dev auto-fill badge (`🔑 Code received: [XXXXXX] (Click to fill)`), and 3D `IsometricButton` ("Verify Code").
      - **Step 3 (Verified / New Password)**: Glowing emerald-green confirmation badge (`✓ OTP Code Verified Successfully!`), step badge ("Step 3 of 3 · Reset Password"), dual 3D Glass Prism password fields (`PasswordField`) for New Password and Confirm Password with eye-toggle password visibility controls, and 3D `IsometricButton` ("Update Password").
      - **Step 4 (Success / Verification Complete)**: Glowing emerald-green circular checkmark badge (`✓`), confirmation text ("Email Verified!" / "Password Updated!"), and 3D `IsometricButton` ("Back to Login").
    - Full keyboard accessibility: `Escape` key to close, auto-dismiss on backdrop outside click or `✕` close button, loop focus navigation.
    - Local mail proxy at `/dev-mail` dynamically connects Vite frontend to local development mail viewer (`http://127.0.0.1:8025/messages`) for zero-friction local OTP testing.
    - Visual verification captures saved directly to `artifacts/preview/` (`otp-verify-step.png`, `otp-verified-step.png`, `email-verified-success.png`).

---

## 3. Verification Metrics & Receipts
- **Lint**: 0 warnings, 0 errors (`npm run lint`).
- **Build / Typecheck**: Strict TypeScript verification passed with 0 errors (`npm run build`).
- **Playwright Tests**: 21/21 passed in Chromium (100% green, 54.3s).
- **Visual Validation**: Full set of screenshots captured and verified in `artifacts/preview/` and project artifact brain directory.
- **Git Sync**: Synchronized with remote `origin/main`.

---

## 4. Immediate Roadmap & Trajectory
1. [x] Documentation sync across all core `.md` files.
2. [x] Configure `components.json` and install dependencies.
3. [x] Scaffold and populate dedicated directories for all DesignPass components.
4. [x] Build extensible Component Registry (`src/registry/components.tsx`) and dedicated `ComponentsGalleryPage` (`src/pages/ComponentsGalleryPage.tsx`).
5. [x] Re-engineer `IsometricButton` to project 3D depth towards downside.
6. [x] Run lint, typecheck, build, and test validation.
7. [x] Connect hash routing (`#/components`) and floating navigation switcher.
8. [ ] Future dashboard views (analytics, settings, profile panels) utilizing the DesignPass components.
