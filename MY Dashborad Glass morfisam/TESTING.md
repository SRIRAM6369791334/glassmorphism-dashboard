# Testing and verification

## Authentication verification - 2026-10-09

Frontend: `npm run lint`, `npm run build`, `npm run test:e2e`. Contract tests mock API outcomes, cover unsafe error text, retries, OTP, session restore/logout, keyboard focus and responsive layouts. Backend: `npm run check` and `npm run test:integration` with an isolated TEST_DATABASE_URL; real MySQL/Redis/BullMQ/local SMTP. See `docs/ui/verification.md` and sibling `docs/handoff.md` for actual results and remaining limits. No capacity claim without load tests. Docker is deferred.

Purpose: define useful verification and preserve honest results. Initial type checking, lint, and build passed; final suite/refinement verification is in progress. Current evidence lives in [verification](docs/ui/verification.md).

## Static checks

Run type checking, ESLint, and production build. Review the dependency set, bundle output, local asset loading, and browser console. A successful build alone does not establish visual correctness.

## Browser behavior

Use Playwright with Chromium, Firefox, and WebKit to verify:

- Initial Login; welcome-panel buttons and inline links switch both ways.
- Incoming headings receive focus and outgoing forms cannot receive focus.
- Form fields accept input and each password visibility control updates its type and accessible name.
- Submit and recovery actions announce accurate preview notices, without a network authentication request or credential storage.
- Repeated switching settles consistently; unmounting or replacing transitions leaves no timer effect.
- Keyboard navigation reaches visible controls with a visible focus indicator.
- Reduced-motion preference removes movement while preserving the final state.
- Local assets load without console or page errors.

Forms deliberately use noValidate for this static preview; submission should display the neutral notice even without entered values. Use synthetic values to verify typed input and the absence of credential transport/storage. Do not use real credentials.

## Visual and responsive review

Compare both states at 1128 × 778 against cropped references. Check card dimensions, column spacing, typography, underlines, pills, blur, lighter panel, diagonal divider, and fixed wallpaper. Inspect intermediate frames around 200 ms and 400–600 ms after switching.

Also review desktop, laptop, tablet, 390 px mobile, and 320 px small-mobile layouts. At 768 px and above use side-by-side panels; below that use form above compact welcome panel. Check overflow, content clipping, scrolling, touch targets, and readability.

Automated screenshots are review aids, not proof of pixel identity. The recreated wallpaper and unknown font limit exact matching. Do not approve generated image baselines without inspecting them.

## Evidence record

Record commands, engine coverage, viewport coverage, outcomes, and limitations in [the verification record](docs/ui/verification.md). Keep transient screenshots/reports in ignored artifact directories. Report blocked checks instead of claiming they passed.
