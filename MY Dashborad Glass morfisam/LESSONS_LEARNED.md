# Lessons learned

Purpose: record actual mistakes or failed approaches, root causes, solutions, and prevention. Technical discoveries belong in [LEARNINGS.md](LEARNINGS.md).

## 2026-10-08 — Initial glass appeared too flat

**Issue:** The first desktop screenshot lacked the cloudy tonal variation visible in the source card.

**Root cause:** Large, uniform central wallpaper faces sat directly beneath the card. The opaque dark surface further subdued their limited variation.

**Solution:** Add varied interior facets and local tonal transitions to the wallpaper. Refine surface opacity to 45% and blur to 28 px together. The final screenshots show the intended cloudy variation.

**Prevention:** Review the wallpaper through the actual card crop early. Judge background geometry, translucency, and blur as one composition, then recheck contrast and multiple browsers.

## 2026-10-08 — Passing interaction checks missed missing frost

**Issue:** The initial 42 browser tests passed, but manual Firefox/WebKit screenshot review showed sharp background facets through the card.

**Root cause:** In the Windows headless rendering environment, native backdrop-filter support/computed style did not guarantee the expected rendered blur. Isolation/translateZ trials did not resolve the discrepancy.

**Solution:** Add a noninteractive, overscanned wallpaper layer clipped within the card, using the same SVG, dark tint, and 28 px CSS filter blur. Keep native backdrop-filter and the opaque unsupported-feature fallback. Final desktop images were inspected in Chromium, Firefox, and WebKit and show frost.

**Prevention:** Validate visual effects through cross-engine screenshots as well as interactions and CSS feature queries. Rerun affected checks after the rendering fix.

## 2026-10-08 — Documentation synchronization during rapid bugfix turns

**Issue:** During quick iterative bugfixes (removing the feature showcase section and eliminating the desktop side scrollbar), code changes and git commits were pushed, but repository `.md` files (`CHANGELOG.md`, `AI_CONTEXT.md`, `TODO.md`, `DECISIONS.md`) were temporarily omitted.

**Root cause:** Prioritizing immediate verification and green test suites over documentation updates created context rot and violated the core working agreement (`AGENTS.md`).

**Solution:** Treat documentation updates as an atomic part of every feature or bugfix lifecycle. Update `AI_CONTEXT.md`, `CHANGELOG.md`, `TODO.md`, `DECISIONS.md`, and `project_state.md` alongside code changes.

**Prevention:** Establish a strict step order: Requirement → Architecture Decision → Implementation → Test Verification → Documentation Update → Git Commit & Push. Never defer documentation across turns.

## 2026-10-08 — [Visual_Perspective] 3D button tilt and stand angle caused upward projection instead of downside depth

**Issue:** When `IsometricButton` was rotated horizontally (`rotateZ: 0deg`, `rotateX: 25deg`), the user observed that the 3D depth appeared to face upwards rather than downwards ("that button up side la 3D aa irukthu but enaku downside la 3D aa vanum").

**Root cause:** 
1. The default `standAngle: -10deg` leaned the prism backwards around its bottom hinge, causing the top edge to stand up in 3D space.
2. The default edge color (`--iso-btn-edge`) was nearly pure black (`rgb(20, 17, 27)`), blending completely into the dark card background and obscuring the bottom thickness.
3. The top face's 1px bright highlight made the upper boundary the dominant visual focal point, giving the illusion of upward elevation.

**Solution:** 
1. Reset `standAngle` to `0deg` to keep the prism flat against the ground plane without backward elevation.
2. Set forward tilt to `rotateX: 30deg` with `thickness: 18px` and `gapRest: 12px`, angling the top face forward so the extrusion drops downwards.
3. Added `edgeColor` support (`#261c36`) with a bottom shadow (`0 1px 0 rgba(0,0,0,0.45)`) and top-face bottom bevel (`inset 0 -2px 0 rgba(0,0,0,0.45)`). The 3D depth and purple underglow now project distinctly towards the downside, matching the 3D glass prism input fields.

**Prevention:** When implementing 3D isometric components on flat cards, inspect perspective from both viewer eye-level and light source angles. Ensure extrusion thickness is contrasted against the background with directional edge lighting and downward shadows.

## 2026-10-08 — [State_CSS] Filled input persistent illumination and React 19 onInput typing

**Issue:** 
1. The user requested that the border light effect stay visible once an input is filled, even without hover or focus ("once i am fill any inputs then that ligth effect showgaun na hover or touch panlanum").
2. Passing `onInput` handler in `GlassField.tsx` threw TypeScript error `TS2345: Argument of type 'FormEvent<HTMLInputElement>' is not assignable to parameter of type 'InputEvent<HTMLInputElement>'`.

**Root cause:** 
1. The CSS was scoped only to `:focus-within` and `:hover`. Once the user clicked away (blur) or moved their pointer away, the styles reset.
2. React 19 tightened the signature of `InputHTMLAttributes<HTMLInputElement>['onInput']`, which differs from `React.FormEvent<HTMLInputElement>` in strict TS configurations.

**Solution:** 
1. Combined modern CSS selector `:has(input:not(:placeholder-shown))` with state attribute `[data-filled='true']`. This provides instant zero-latency visual feedback natively in CSS while keeping React's controlled state synchronized.
2. Added safe event passthrough in `GlassField.tsx` without type mismatch, updating internal filled state during both `onChange` and `onInput`.

**Prevention:** 
Use pure CSS pseudo-class `:has(input:not(:placeholder-shown))` for input value presence whenever possible to eliminate rendering lag, and pair it with resilient React state fallback for controlled inputs.

## 2026-10-08 — [CSS_Autofill] Browser suggestion / autofill solid background rectangle artifact

**Issue:** 
When users selected an autocomplete or browser credential suggestion, a solid dark rectangular block appeared behind the text inside the input field, whereas manually typed text remained transparent and seamlessly blended with the glass capsule.

**Root cause:** 
The CSS contained `.field input:-webkit-autofill { box-shadow: inset 0 0 0 100px #29292e; }`. Because `<input>` sits inside a rounded capsule container `.field` next to an icon, applying an opaque `#29292e` box-shadow to the `<input>` element rendered a harsh, hard-edged rectangle that covered only the input area, breaking the rounded glassmorphism aesthetic.

**Solution:** 
Removed the opaque `#29292e` box-shadow. Implemented the standard long-duration color transition technique (`transition: background-color 5000000s ease-in-out 0s`) with transparent box-shadow (`box-shadow: 0 0 0 1000px transparent inset !important`) and both `:-webkit-autofill` and `:autofill` pseudo-classes. This suppresses browser default autofill backgrounds while preserving 100% transparency.

**Prevention:** 
Never use opaque inset box-shadows on sub-elements of styled compound input capsules to override browser autofill. Use indefinite background transition delays with transparent fills to preserve capsule transparency.

## 2026-10-08 — [CSS_Engine] Blink/WebKit placeholder background-clip limitation and accessible overlays

**Issue:** 
Applying `-webkit-background-clip: text` and `-webkit-text-fill-color: transparent` to `input::placeholder` does not render gradient text in Chromium because the Blink engine disables `background-clip: text` on pseudo-element placeholders.

**Root cause:** 
The HTML `<input>` shadow DOM restricts background-clip inheritance on pseudo-elements for security and rendering consistency.

**Solution:** 
Implemented a pointer-events-none overlay containing `<ShimmerText>` positioned over the input area in `GlassField.tsx`. The overlay fades seamlessly on focus (`:focus-within`) or value fill (`data-filled='true'`), while the underlying `<input>` retains its native `placeholder` and `id`/`label` association for accessibility and screen readers.

**Prevention:** 
For animated or rich gradient placeholders, use an accessible overlay pattern decoupled from the native input shadow tree rather than relying on pseudo-element clipping.

## 2026-10-08 — [CSS_Inheritance] Shared button class hierarchy applied pill hover box to text/link buttons

**Issue:** 
When hovering or touching inline text links ("Login", "Sign Up", "Forgot Password?"), a translucent grey/white rectangular box background with borders appeared behind the text instead of a clean, seamless text link.

**Root cause:** 
In `GlassButton.tsx`, every button regardless of `variant` was assigned `${styles.baseButton} ${styles.glass} ${variantClass}`. Because `.glass` was attached to `variant="text"`, the `.glass:hover` rules (`background-color: rgb(255 255 255 / 14%)`, `border-color: rgb(255 255 255 / 85%)`, `box-shadow`) were active on hover and touch. Single-class overrides like `.glassText:hover { background: none; }` could not eliminate the border or inset shadows due to specificity and missing properties.

**Solution:** 
1. Decoupled `variant === 'text'` in `GlassButton.tsx`: text buttons receive only `styles.glassText` without `.baseButton` or `.glass`.
2. Enforced strict `background: transparent !important`, `border: none !important`, and `box-shadow: none !important` across `.glassText`, `:hover`, `:focus-visible`, and `:active`.
3. Upgraded the interaction with a sleek neon lavender-purple glow and an animated neon gradient bottom underline (`::after`), and gave "Forgot Password?" a soft ghost amethyst aura.

**Prevention:** 
Text and ghost link variants must never inherit container or surface classes designed for raised buttons. Keep inline text button primitives structurally isolated from pill button stylesheets.

## 2026-10-08 — [React_State] Synchronous state updates in useEffect violating React Hooks guidelines

**Issue:** 
In `RecoveryModal.tsx`, resetting the OTP countdown timer (`setCountdown(30)`) inside a `useEffect` keyed on the step transitioning to `'otp'` caused an ESLint error: `react-hooks/set-state-in-effect: Synchronous state update inside effect body`.

**Root cause:** 
Calling `setCountdown(30)` or `setCanResend(false)` synchronously when an effect runs triggers an immediate secondary render cycle before the DOM paint completes, which modern ESLint React Hooks rules flag to avoid infinite loops and performance churn.

**Solution:** 
Moved state initialization logic directly into the user action handlers (`handleEmailSubmit` and `handleResendOtp`) where the step change is initiated. Left the `useEffect` strictly scoped to managing the active `setInterval` cleanup and decrements.

**Prevention:** 
Reset step-specific state during transition events (handlers/callbacks) rather than passively within `useEffect` bodies. Reserve effects for synchronization with external APIs or timer subscriptions.

## 2026-10-08 — [Test_Selectors] Playwright strict mode disambiguation between modal headings and input labels

**Issue:** 
Playwright test execution failed on `page.getByLabel('New Password')` with a strict mode violation: resolving to 2 elements (the dialog header `<h2>Set New Password</h2>` linked via `aria-labelledby`, and the input element `<input name="newPassword" ... />`).

**Root cause:** 
The dialog header text contained "New Password", and `getByLabel` matches accessible name attributes across elements when substrings or labels overlap with role declarations.

**Solution:** 
Scoped the locator explicitly to the input field within the dialog container: `dialog.locator('input[name="newPassword"]')` and `dialog.locator('input[name="confirmPassword"]')`.

**Prevention:** 
When testing complex compound modals with labeled fields that share words with the modal title or header badges, target specific input attributes (`name`, `type`, or exact labels) scoped inside the dialog locator.

## 2026-10-09 ? Auth integration verification discoveries

The native dialog prevented background interaction but did not give consistent reverse-Tab wrapping, so an explicit Tab boundary handler was added and tested. Firefox discarded clipboardData supplied to a synthetic ClipboardEvent constructor; inspection showed the source DataTransfer had text but the event had no types. The contract test now attaches clipboardData to a generic paste event, exercising the real handler consistently across engines. The production handler uses the standard text/plain MIME type.

The first live signup-to-login browser check filled the incoming form during its inert transition. Waiting for the existing data-phase=idle contract fixed the test; the full live flow then passed. Do not bypass this transition boundary with forced actions.

A dependency audit found deepmerge-ts below 8.0 in Prisma tooling. A targeted 8.0 override removed the finding; Prisma validate/generate and actual MySQL migrations passed with the override. No force-downgrade of Prisma was used.

Browser verification against a reused Vite dev server reset forms during package/TypeScript configuration edits. Trace inspection showed repeated root navigations, not credential form submissions. Contract tests now run an isolated production preview so live reload cannot invalidate their state. Failed development-server runs are preserved as investigation evidence, not counted as successful checks.

WebKit desktop screenshot inspection exposed an invisible inline account-switch label: the footer gradient's inherited -webkit-text-fill-color: transparent reached its nested button. An auth-footer-scoped currentColor override restores the label without changing the gradient caption or shared component styling. Behavioral visibility checks alone did not detect this painted-text issue.

## 2026-10-09 — [Test_Selectors] Strict-mode conflict on multiple role="status" elements in RecoveryModal

**Issue:** 
`tests/auth.spec.ts:398` failed on `expect(dialog.getByRole('status')).toHaveText('Passwords do not match.')` because Playwright found two elements with `role="status"`: the newly added `.verifiedBanner` ("✓ OTP Code Verified Successfully!") and the dynamic `.errorNotice` ("Passwords do not match.").

**Root cause:** 
Adding `role="status"` to both a persistent confirmation banner and transient form validation notices creates ambiguity under Playwright's strict mode locator resolution when querying `dialog.getByRole('status')`.

**Solution:** 
Changed `.verifiedBanner` to use `aria-label="OTP verification status"` without `role="status"`, preserving the visible visual badge and assistive technology labeling while leaving `role="status"` exclusively for live form error notices and updates.

**Prevention:** 
Reserve ARIA live landmark roles (`role="status"`, `role="alert"`) strictly for dynamic feedback regions that announce live changes. Use semantic tags and descriptive `aria-label` attributes for static or step-confirmation banners to avoid locator ambiguity in automated test suites.

