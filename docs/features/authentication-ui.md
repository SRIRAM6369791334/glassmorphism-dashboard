# Authentication UI specification

Status: implemented; final cross-browser and visual-refinement verification in progress.

## Login

Initially displayed at `/`. Form on the left, with Login heading, account identity field, password field with visibility control, Login submit button, account-switch link, and Forgot Password action. Right welcome copy is “HELLO, FRIEND!” with “Enter your personal details and start your journey with us.” and “Create Account” action.

## Registration

Form on the right, with Create Account heading, Full Name, Work Email, Create Password, Sign Up button, and “Already a Member? Login” switch. Left welcome copy is “WELCOME BACK!” with “Already a Member? Please Login with your credentials.” and “Sign in” action.

Match visible casing and spacing to the source where feasible. Fields begin empty; the recording's example credentials are not application defaults.

## Interaction and data

Both welcome actions and inline account links change modes. The active form accepts transient input; password visibility is independently toggleable. Submit displays a neutral notice that authentication is not connected. Recovery displays an equivalent notice that recovery is not connected. Do not claim account creation, login success, or email delivery.

LoginValues uses username/password; RegisterValues uses fullName/email/password. AuthSubmitHandlers supplies onLogin/onRegister callbacks independent of styling. Forms use noValidate so a preview submit is available without invented validation rules; switching remounts the view and clears its fields. Do not send, log, or persist credentials. Backend API, validation, loading, failure, session, and protected-route behavior is deferred.

## Transition and accessibility

Outgoing content fades/slightly moves outward over approximately 200 ms; incoming content and the lighter diagonal welcome side settle over approximately 400 ms. Keep shell and wallpaper fixed. Make inactive content noninteractive and focus the incoming heading. Mobile uses a 100 ms exit and 150 ms entry fade; reduced-motion preference switches immediately. Repeated switch activation is ignored while a transition runs, and timer cleanup prevents updates after unmount.

Acceptance checks are recorded in [TESTING.md](../../TESTING.md).
