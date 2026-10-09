# Component guidelines

Current integration (2026-10-09): LoginValues exposes email/password. AuthScreen delegates to authApi; controls accept pending/disabled states and real validation. RecoveryModal uses native dialog, Tab containment, heading focus and focus return. Credentials never enter browser storage. Earlier preview-only paragraphs are historical.

Purpose: define reusable component responsibilities and interaction ownership.

## Composition

The app mounts AuthScreen. It owns static feedback and uses useAuthTransition for active mode, transition coordination, and heading focus. One AuthForm supplies the distinct field sets and copy for both modes; WelcomePanel supplies the welcome content. Feedback is a small live-region component colocated with AuthForm.

Share a card shell, form layout, field, password field, button, welcome panel, inline icon, and feedback component. Small related components may stay in one module if readability benefits. Extract genuine reuse; avoid configurable form generators.

## Interfaces

LoginValues exposes username/password; RegisterValues exposes fullName/email/password; AuthSubmitHandlers exposes onLogin/onRegister. These types are independent of presentational styling. Accept typed submission callbacks so a future service adapter can replace the static notice behavior. Prefer native input/button props plus a small set of purposeful custom props.

Fields require an accessible label and stable association. Password visibility is local to the password control. Buttons default to `type="button"` unless explicitly used for submission. Use real forms and submit handlers.

## State and motion

Only the active form is interactive. Do not leave visually hidden inputs in the tab order. Preserve a consistent final state during quick repeated mode changes and clear transition timers. Set focus on the new form heading after switching without opening the mobile keyboard.

Keep entered data transient, with no local/session storage or network calls. Switching mode remounts the keyed view and clears its form values and password-visibility state. Repeated switch activation during an active transition is ignored. Forms use noValidate because real validation rules are deferred; preview submission still works with empty values.

## Styling and review

Use CSS Modules and shared tokens. Keep geometry, text hierarchy, and motion consistent between views. Test a reusable control through user-visible behavior rather than assertions that mirror internal implementation. See [ACCESSIBILITY.md](ACCESSIBILITY.md) for semantic requirements.
