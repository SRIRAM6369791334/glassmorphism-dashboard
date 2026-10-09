# Architecture overview

The application is a single client-rendered authentication preview. Vite handles development and production bundling. React owns the active view and controls; TypeScript describes the form contracts; CSS Modules and shared custom properties encode the design.

The dependency direction is app → authentication feature → shared UI. Shared controls must not import feature state or future service code. Local assets and global tokens may be used across features.

AuthScreen coordinates static notices and useAuthTransition manages modes, phases, and heading focus. AuthForm collects transient values via FormData and invokes typed callbacks, with noValidate deliberately deferring validation. The keyed form resets between modes. Shared UI exports Button, Field/PasswordField, and Icon. A future validation/service adapter can replace the callback implementation without changing the visual primitives.

This structure scales by adding features at their boundaries. Routing, global auth state, network clients, and validation libraries remain deferred until concrete requirements justify them.

See [architecture](../../ARCHITECTURE.md), [component guidelines](../../COMPONENT_GUIDELINES.md), and [accepted decisions](../../DECISIONS.md).
