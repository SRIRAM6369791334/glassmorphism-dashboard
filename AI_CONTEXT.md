# Current project context

Updated: 2026-10-08. Status: application enhanced with Lightswind-style GlowingCards, ParticlesCursor, and interactive glass specular reflections. All 42 cross-browser Playwright tests passing on Chromium, Firefox, and WebKit. See [verification](docs/ui/verification.md) for current evidence.

## Purpose and scope

A static Login/Register experience based on supplied reference images, with an interactive Lightswind Glowing Cards system, particle physics cursor, and dark glassmorphic styling. No backend, database, recovery service, or deployment.

## Stack and structure

React/React DOM 19.3.0, TypeScript 6.0.3, Vite 8.3.3 with React plugin 6.1.2, CSS Modules/custom properties, ESLint 10.12.0, and Playwright 1.64.0. Node >=22.20.0 is required by package.json.

`src/app` composes the screen; `src/components/lightswind` & `src/components/lightswind-pro` house `GlowingCards` and `ParticlesCursor`; `src/features/auth` owns forms, values, mode transitions and notices; `src/components/ui` holds shared Button, Field/PasswordField and Icon; `src/styles/global.css` owns tokens/global rules; `src/assets` holds the SVG wallpaper. Browser checks live in tests.

## Implemented behavior and interfaces

One screen at `/` starts in Login. AuthScreen owns notices and uses useAuthTransition for mode/phase/focus. A shared AuthForm renders each field set and its feedback live region; WelcomePanel renders side-specific content.

LoginValues contains username/password; RegisterValues contains fullName/email/password. AuthSubmitHandlers exposes onLogin/onRegister callbacks. AuthForm collects FormData on submit; callbacks currently display accurate unconnected-service notices. Custom/native validation is deliberately deferred (`noValidate`). Form values reset on view changes because the view is keyed by mode.

Fields have labels/autocomplete, password controls expose visibility state, and incoming headings receive focus. Outgoing content becomes inert; repeated activation during a transition is ignored; timer cleanup handles unmount. Desktop motion is 200 ms exit + 400 ms enter, mobile is 100 + 150 ms fade, and reduced motion switches immediately.

## Design

Desktop card measures 900 × 530 px at the 1128 × 778 reference viewport, positioned at x114/y124. Forms target 300 px; corners are 24 px. Arial approximates the source: form title 28 px, welcome heading 38 px, supporting copy 14 px, primary controls 44 px. Divider is 47% top / 53.5% bottom. Login form left, registration right; lighter welcome side follows the opposite side.

The local SVG reproduces the angular black wallpaper concept. Below 768 px the form stacks above compact welcome content with natural scrolling and 16 px input text. Final glass opacity/blur refinement and its checks are still in progress.

## Boundaries and next work

No credential request, logging, persistence, or fake authenticated state. Future validation/service integration connects through typed callbacks; endpoints, response shapes, sessions, tokens, loading/error contracts, and protected routes remain future decisions.

Type checking, lint, and production build have passed on the initial implementation. The full browser suite and final tuned-build checks are pending at this update. Original wallpaper and font remain unavailable, so pixel identity is not claimed. Read [TODO.md](TODO.md), [DECISIONS.md](DECISIONS.md), and [TESTING.md](TESTING.md).
