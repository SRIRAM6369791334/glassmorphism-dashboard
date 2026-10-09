# 0009 — 4-Step Email OTP verification and password reset flow

- **Status**: Accepted
- **Date**: 2026-10-08
- **Deciders**: User request, Lead Architect

## Context

The password recovery experience originally dispatched a simulated email reset link. The user explicitly requested an authentic Email OTP (One-Time Password) workflow:
"i need not send link in email, i am send email otp method to forgort password".

In addition, all visual previews and test artifacts were requested to be stored strictly in `D:\UI Project\MY Dashborad Glass morfisam\artifacts\preview\`.

## Decision

1. **Architecture & State Machine**:
   - Transformed `RecoveryModal.tsx` into a 4-step state machine:
     - `'email'`: User enters registered email address.
     - `'otp'`: User inputs the 6-digit numeric verification code.
     - `'new-password'`: User creates and confirms their new password.
     - `'success'`: Visual success confirmation with green checkmark and "Back to Login" action.

2. **UX & Component Primitives**:
   - **Step 1**: Uses `Field` with `mail` icon, floating label, and 3D `IsometricButton` ("Send OTP Code") with neon purple underglow.
   - **Step 2**: Custom 6-digit frosted glass OTP grid with auto-focus advance, backspace navigation, paste support, and a 30s countdown timer ("Resend OTP in 29s").
   - **Step 3**: Dual `PasswordField` components with show/hide password visibility toggle and mismatch validation.
   - **Step 4**: Glowing green checkmark badge (`✓`) and 3D `IsometricButton` ("Back to Login").

3. **Accessibility**:
   - `role="dialog"`, `aria-modal="true"`, dynamic step titles linked via `aria-labelledby`.
   - `Escape` key listener and backdrop outside click dismiss.
   - Numeric input attributes (`inputMode="numeric"`, `pattern="[0-9]*"`) for mobile keyboard optimization.

4. **Verification**:
   - Automated e2e test added in `tests/auth.spec.ts` exercising all 4 steps end-to-end.
   - Visual verification screenshots captured and stored in `artifacts/preview/`:
     - `recovery-otp-step1-email.png`
     - `recovery-otp-step2-code.png`
     - `recovery-otp-step2-filled.png`
     - `recovery-otp-step3-newpassword.png`
     - `recovery-otp-step4-success.png`

## Consequences

- Direct, modern OTP verification UX with immediate password reset capability.
- 100% compliant with React Hooks guidelines, Playwright tests, and zero build errors.
