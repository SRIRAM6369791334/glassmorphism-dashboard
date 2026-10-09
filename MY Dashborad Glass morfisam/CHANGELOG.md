# Changelog

## 2026-10-09 — Connected authentication foundation & OTP Verification

- Preserved React/Vite and glass UI while connecting signup, OTP verification, login, session rotation/logout and password recovery.
- Added comprehensive 6-digit OTP verification step with individual frosted glass boxes, keyboard backspace navigation, auto-advance, paste support, and 60s countdown timer.
- Added post-verification confirmation feedback: glowing emerald `.verifiedBanner` ("✓ OTP Code Verified Successfully!") on Step 3 (Set New Password) and animated `.successContainer` ("Email Verified! ✓") on Step 4.
- Integrated Vite `/dev-mail` proxy to local mail server (`http://127.0.0.1:8025/messages`) with one-click code detection badge (`🔑 Code received: [XXXXXX] (Click to fill)`) for instant local testing.
- Added feature-local API boundary, safe timeout/idempotency feedback, pending states and transient token handling.
- Reused OTP modal for signup/recovery; fixed resend lifecycle and modal focus containment/return.
- Created sibling NestJS/Prisma/MySQL/Redis/BullMQ foundation, 13 core tables, transactional outbox, RBAC and security/observability infrastructure.
- Native isolated local services and local-only email verification; Docker deferred until final stage. Verification evidence lives in docs/ui/verification.md and sibling docs/handoff.md.


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
- Upgraded all core authentication action buttons (`Login`, `Create Account`, `Sign in`, and `Sign Up`) to 3D `IsometricButton` with responsive neon glow and spring hover physics.
- Transformed all input fields (`Username`, `Password`, `Full Name`, `Work Email`) into 3D Glass Prism inputs with extruded 3D bevels, top highlight edge, tactile elevation, and glowing neon purple floor reflections on focus, while strictly preserving theme colors, icons, and accessibility.
- Implemented comprehensive 3D Typography suite combining Ideas 1, 3, and 4:
  - **Idea 1 (3D Block Extrusion)** on headings: `.welcome h2` ("HELLO, FRIEND!", "WELCOME BACK!") and `.form h1` ("Login", "Create Account") featuring 7-layer stacked downward 3D shadows with neon purple gradient extrusion and deep floor drop-shadows.
  - **Idea 3 (3D Raised Metallic Bevel)** on button labels: `.iso-btn-top` text with crisp raised metallic bevel highlights, neon underglow, and active click compression.
  - **Idea 4 (Glass Engraved / Inset 3D)** on field text and icons: `.field input`, placeholder, `.fieldIcon`, `.eye`, `.formFooter`, and `.welcome p` with tactile engraved 3D dual-tone shadows (`0 -1px 1px rgba(0,0,0,0.8), 0 1px 1px rgba(255,255,255,0.18)`).
- Persistent 3D Border Light & Floor Glow on Filled Inputs: Input fields (`GlassField`) now maintain full purple neon border illumination, top highlight edge, 3D prism depth, and glowing floor reflections when filled with content (via both CSS `:has(input:not(:placeholder-shown))` and React `data-filled="true"` tracking), persisting even when the input is no longer hovered, touched, or focused.
- Target-Scoped `ShimmerText` Animation with Custom Matching Color: Deployed animated sweeping light shimmer across specifically requested brand targets: `WELCOME BACK!` (heading), `Create Account` (heading and button), `Full Name` (input placeholder overlay), `Login` (heading and button), and `HELLO, FRIEND!` (heading). Tuned the shimmer gradient palette to custom matching theme tokens (`#ffffff` base with `#e9d5ff` -> `#c084fc` -> `#f5d0fe` lavender-purple neon sheen) while strictly leaving other field labels, secondary copy, and helper text in their clean 3D engraved states.
- Interactive Frosted Glass Password Recovery 4-Step Email OTP Flow (`RecoveryModal`): Replaced the standard reset link method with an authentic 4-step Email OTP verification and password reset flow:
  - **Step 1 (Email Verification)**: 3D Glass Prism email input (`Field`) with mail icon and 3D `IsometricButton` ("Send OTP Code") with neon purple underglow.
  - **Step 2 (6-Digit OTP Verification)**: 6 individual frosted glass OTP input boxes with auto-advance on entry, backspace navigation, clipboard paste support, numeric filtering, active 30s countdown timer ("Resend OTP in 29s"), and "Verify OTP" 3D button.
  - **Step 3 (Set New Password)**: Dual 3D Glass Prism password fields for "New Password" and "Confirm Password" with built-in password visibility reveal icons (`PasswordField`) and "Update Password" 3D button.
  - **Step 4 (Success Confirmation)**: Animated glowing green checkmark badge (`✓`), confirmation text ("Password Reset Successful!"), and "Back to Login" 3D button.
  - Full keyboard accessibility, backdrop dismiss, Escape key handling, and step progress indicators ("STEP 1 OF 3 • EMAIL VERIFICATION", etc.).
  - Automated Playwright test added to `tests/auth.spec.ts` testing all 4 steps end-to-end.
  - Visual verification captures saved directly to `artifacts/preview/` (`recovery-otp-step1-email.png`, `recovery-otp-step2-code.png`, `recovery-otp-step2-filled.png`, `recovery-otp-step3-newpassword.png`, `recovery-otp-step4-success.png`).

### Refined

- Eliminated unwanted rectangular hover/touch background box on inline switcher links and text buttons: decoupled `<GlassButton variant="text">` from `.baseButton` and `.glass` classes in `GlassButton.tsx`, which were erroneously applying `.glass:hover` pill styles (`background-color: rgb(255 255 255 / 14%)`, border, and inset box-shadow). Enforced strict zero-background, zero-border, and zero-box-shadow across `:hover`, `:focus-visible`, and `:active` in `Buttons.module.css`. Upgraded switcher links (`Sign Up`, `Login`) with glowing lavender-purple typography (`#c084fc` -> `#f3e8ff`) and an animated neon gradient bottom underline (`::after`), and gave `Forgot Password?` a subtle ghost amethyst aura without underline or box artifacts.
- Enhanced subtitles (`.welcome p`) and form footer prompts (`.formFooter p`) with Frosted Silk Dual-Tone Gradient typography (`#f8fafc` -> `#cbd5e1` -> `#94a3b8`) with soft purple ambient glow (`filter: drop-shadow(0 0 14px rgba(168, 85, 247, 0.25))`), creating clear visual hierarchy above the interactive links.
- Fixed browser autofill / autocomplete suggestion background artifact: removed legacy solid `box-shadow: inset 0 0 0 100px #29292e` from `.field input:-webkit-autofill`. Applied the long-duration color transition technique (`transition: background-color 5000000s ease-in-out 0s`) with transparent inset shadow and `:autofill` pseudo-class coverage. Browser suggestions now render seamlessly transparent across the glass pill capsule without creating a harsh rectangular background block behind the text.
- Re-engineered `IsometricButton` 3D projection angle and slice styling: eliminated backward lean (`standAngle: 0deg`), adjusted forward tilt (`rotateX: 30deg`, `rotateZ: 0deg`), increased extrusion depth (`thickness: 18px`, `gapRest: 12px`), and added `edgeColor` support (`#261c36`) with bottom slice shadow (`0 1px 0 rgba(0,0,0,0.45)`) and top-face bottom bevel (`inset 0 -2px 0 rgba(0,0,0,0.45)`). This guarantees that the button's 3D depth and purple underglow project prominently towards the **downside** rather than tilting upward, harmonizing perfectly with the 3D prism input fields.
- Removed feature showcase card section from AuthScreen while strictly preserving cursor particles, specular card border illumination, and input neon glow.
- Eliminated desktop vertical/horizontal scrollbar: removed extra 64px bottom padding on `.screen`, centered `.authHero` vertically with `margin: auto 0`, and set `ParticlesCursor` canvas bounds to `100%` within fixed inset.
- Varied central wallpaper facets after screenshot review showed that broad uniform geometry appeared flat behind the glass.
- Optimized RAF animation loops to suspend when quiescent, preventing CPU throttling and test timeouts across software-rendered WebKit on Windows.
- Standardized cross-browser test timeouts and stacking contexts for deterministic hit-testing.

### Verification

Complete pipeline (`npm run check`) fully verified:
- `npm run lint`: passed with 0 errors.
- `npm run build`: built in 1.27s with strict TypeScript type checking (`tsc --noEmit && vite build`).
- `npm run test:e2e`: all 14 Chromium Playwright tests passed (100% pass rate).

