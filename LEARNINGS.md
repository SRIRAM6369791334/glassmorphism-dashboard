# Technical learnings

Purpose: record useful discoveries and their future application. Actual mistakes and failed approaches belong in [LESSONS_LEARNED.md](LESSONS_LEARNED.md).

## 2026-10-08 — Separating the design from its recording

**Learning:** The 1920 × 1020, approximately 6.233-second recording contains a much smaller authentication demonstration inside surrounding presentation and browser/social chrome. The UI region is approximately 480 × 331 px; the card is approximately 383 × 226 px.

**Why it matters:** Matching the entire recording would incorrectly recreate unrelated chrome and make the application too small.

**Future usage:** Crop the intended product region before comparing proportions. Scale the card to the approved approximately 900 × 530 px desktop target and use the screenshots for settled-state composition.

## 2026-10-08 — Motion evidence has limits

**Learning:** Both view changes use a brief outgoing fade, then incoming motion and a lighter diagonal panel changing sides. The wallpaper and outer card remain stationary. The reference does not establish mobile behavior or an identifiable font.

**Why it matters:** Inferred behavior must not be presented as reference evidence.

**Future usage:** Use the approved 200 ms exit plus 400 ms enter approximation, Arial fallback, and stacked mobile adaptation. Record future reference-derived measurements separately from implementation choices.

## 2026-10-08 — Glass depends on the underlying image

**Learning:** Screenshot inspection of the first rendered card showed little visual texture because the wallpaper's central regions were too uniform beneath the blurred surface.

**Why it matters:** Increasing blur alone cannot create the tonal variation visible in the source; the backdrop itself needs varied geometry and highlights.

**Future usage:** Inspect the background under the actual card crop, vary facet scale/tone there, and tune transparency and blur together. Validate the resulting text contrast and rendering across browser engines.

## 2026-10-08 — Tooling compatibility beats the latest version number

**Learning:** The inspected latest TypeScript 7.0.2 exceeded typescript-eslint 8.71.1's supported range below 6.1. TypeScript 6.0.3 satisfies the lint-tooling range and is used by the implementation.

**Why it matters:** Independently choosing the latest package versions can create an unsupported toolchain.

**Future usage:** Check peer/engine compatibility before installation and preserve the resulting lockfile. The initial installed set audited 164 packages with zero reported vulnerabilities.

## 2026-10-08 — CSS support does not prove rendered blur

**Learning:** Firefox and WebKit in the Windows headless verification environment reported backdrop-filter support and a computed blur value, yet screenshots showed sharp wallpaper beneath the card.

**Why it matters:** Feature detection and passing behavioral tests do not establish visual rendering. The initial 42 browser tests passed while this discrepancy remained visible.

**Future usage:** Inspect screenshots across engines for rendering-sensitive features. A clipped CSS-filtered copy of the same local wallpaper now provides deterministic frost without a second asset or dependency; retain the native backdrop filter and unsupported-feature charcoal fallback.
