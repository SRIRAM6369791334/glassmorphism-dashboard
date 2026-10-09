# Architecture decision index

## Decision 0010 ? Sibling authentication backend (2026-10-09)

The user authorized the backend brief, superseding static-only restrictions. Preserve React/Vite; use a sibling NestJS modular monolith with Prisma/MySQL, Redis and BullMQ. Reuse glass forms and OTP modal, in-memory access tokens and an HttpOnly refresh cookie. Database-authoritative sessions, challenge row locks, durable encrypted idempotency receipts and transactional outbox protect concurrency/retries. No domain modules or Docker work now. Details: [integration plan](docs/architecture/backend-integration-plan.md) and sibling backend docs/architecture.md.

Purpose: maintain dated, reviewable architecture decisions. Each record contains context, options, selected approach, reason, tradeoffs, and date. Supersede records explicitly instead of rewriting their history.

| Date | Record | Status |
| --- | --- | --- |
| 2026-10-08 | [0001 — Client frontend and dependencies](docs/decisions/0001-client-frontend.md) | Accepted |
| 2026-10-08 | [0002 — Static forms and future integration](docs/decisions/0002-static-auth-boundary.md) | Accepted |
| 2026-10-08 | [0003 — Reference fidelity and responsive adaptation](docs/decisions/0003-reference-design.md) | Accepted |
| 2026-10-08 | [0004 — Documentation as project memory](docs/decisions/0004-project-memory.md) | Accepted |
| 2026-10-08 | [0005 — DesignPass.dev modular spring components and hybrid styling](docs/decisions/0005-designpass-components.md) | Accepted |
| 2026-10-08 | [0006 — Downside 3D projection and tactile styling](docs/decisions/0006-downside-3d-projection.md) | Accepted |
| 2026-10-08 | [0007 — Persistent 3D border glow on filled inputs](docs/decisions/0007-persistent-filled-input-glow.md) | Accepted |
| 2026-10-08 | [0008 — Target-scoped ShimmerText animation with theme palette](docs/decisions/0008-scoped-shimmer-text.md) | Accepted |
| 2026-10-08 | [0009 — 4-Step Email OTP verification and password reset flow](docs/decisions/0009-email-otp-recovery-flow.md) | Accepted |

The user approved these choices in the implementation request. Routine work within this scope does not need an additional approval cycle.

## Implementation review — 2026-10-08

The selected boundaries are implemented without additional architecture dependencies. Typed submissions use username/password and fullName/email/password; validation and backend contracts remain deferred. The local wallpaper and glass are being tuned against screenshots within ADR 0003's accepted approximation; this styling refinement does not change the architecture.

### Decision 0005: DesignPass.dev spring components and styling coexistence

- **Context**: The user requested integration of 5 DesignPass components (`IsometricButton`, `LiquidGlass`, `SpringSelect`, `SpringSlider`, `SpringAccordion`) plus dependency `Magnet`.
- **Decision**: Adopt a modular folder structure (`src/components/ui/<category>/<Component>/` and `src/components/effects/<Component>/`). Support Tailwind CSS utilities without interfering with existing CSS Modules (`*.module.css`) and global design tokens (`--color-*`). Install `html2canvas-pro` for WebGL texture fallback in Safari/Firefox. Configure `components.json` for shadcn registry interoperability.

### Decision 0006: Downside 3D projection and tactile styling for action buttons and form inputs

- **Context**: The user requested that action buttons project 3D depth towards the downside (bottom) rather than tilting upwards, ensuring visual coherence with the newly upgraded 3D glass prism input fields.
- **Decision**: 
  1. Remove backward hinge rotation (`standAngle: 0deg`) from `IsometricButton`.
  2. Apply a controlled forward perspective tilt (`rotateX: 30deg`, `rotateZ: 0deg`) with generous extrusion depth (`thickness: 18px`, `gapRest: 12px`).
  3. Expand the `IsometricButton` API with `edgeColor` (`#261c36`), adding a subtle bottom slice shadow (`0 1px 0 rgba(0,0,0,0.45)`) and top-face bottom bevel (`inset 0 -2px 0 rgba(0,0,0,0.45)`).
  4. Ensure 100% preservation of color schemes, typography, keyboard accessibility, and form submit contracts.

### Decision 0007: Persistent 3D border glow on filled inputs

- **Context**: The user requested that when input fields contain text, the neon purple border light and 3D floor reflection remain illuminated persistently, even when the user clicks away or stops hovering.
- **Decision**: 
  1. Leverage modern CSS `:has(input:not(:placeholder-shown))` on the `.box` container for zero-latency, pure-CSS state detection without forcing React re-renders.
  2. Maintain a `data-filled="true"` attribute via `GlassField.tsx` for controlled inputs and environments where `:has` fallback is needed.
  3. Ensure full preservation of focus states, placeholder visibility, input icons, and accessibility.

### Decision 0008: Target-scoped ShimmerText animation with theme matching color

- **Context**: The user requested animated `ShimmerText` strictly on five specific brand text elements: `WELCOME BACK!`, `Create Account`, `Full Name`, `Login`, and `HELLO, FRIEND!`, with custom colors matching the dark glassmorphism theme.
- **Decision**:
  1. Update `Text.module.css` with a high-fidelity linear gradient matching the purple neon aesthetic (`#ffffff` base with `#e9d5ff` -> `#c084fc` -> `#f5d0fe` sheen).
  2. Apply `ShimmerText` to the primary headings (`h1` and `h2`) and primary action buttons (`Login`, `Create Account`), combining the shimmer sheen with existing 3D block extrusion and bevels.
  3. Extend `GlassField` with an accessible `shimmer` prop and pointer-events overlay for the `Full Name` field placeholder that automatically fades on focus or fill.
  4. Preserve reduced-motion preferences (`prefers-reduced-motion: reduce`) and test accessibility contracts.

### Decision 0009: 4-Step Email OTP verification and password reset flow

- **Context**: The user specifically requested that password recovery should not send an email link, but instead use a direct Email OTP (One-Time Password) verification method.
- **Decision**:
  1. Replace the single-step reset link modal with a 4-step state machine (`'email' | 'otp' | 'new-password' | 'success'`) in `RecoveryModal.tsx`.
  2. Step 1: Collect registered email with validation and "Send OTP Code" 3D IsometricButton.
  3. Step 2: Implement 6 distinct frosted glass OTP input boxes with auto-advance, backspace navigation, numeric filtering, clipboard paste support, and a 30s resend countdown timer.
  4. Step 3: Implement new password and confirm password fields with built-in password visibility toggle (`PasswordField`) and match validation.
  5. Step 4: Display a success confirmation card with an animated glowing green checkmark (`✓`) and a "Back to Login" action.
  6. Save all verification screenshots directly in `artifacts/preview/` per project standards.
