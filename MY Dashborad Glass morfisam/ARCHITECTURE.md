# Architecture

## Authentication integration - 2026-10-09

The static submission boundary below is historical. The user authorized a sibling NestJS API. Feature-local `authApi.ts` owns fetch, in-memory access tokens, singleflight refresh and retained retry keys. AuthScreen owns session/pending/error state; AuthForm remains presentational; RecoveryModal reuses the glass OTP design for signup/recovery. Public gallery and local view switching are preserved; no new router or business dashboard.

Vite proxies `/api` and `/health` to port 3000. Production requires same-site HTTPS and exact CORS origins. MySQL is authoritative, Redis temporary coordination, BullMQ a separate worker process in the same modular codebase. See `docs/architecture/backend-integration-plan.md` and sibling backend README. Docker is deferred until the final stage.

Purpose: define structural boundaries and explain why this project is organized this way. Current implementation status lives in [AI_CONTEXT.md](AI_CONTEXT.md).

## Selected architecture

A client-only React application, built by Vite with TypeScript. A single page at `/` initially displays Login and switches to registration through local feature state. CSS Modules scope component styles; global CSS custom properties carry design tokens. No router or global state library is needed for one screen.

Implemented organization:

```text
src/
  app/                 application composition
  features/auth/       form types, forms, card state and presentation
  components/ui/       reusable fields, buttons and inline icons
  styles/              tokens and global styles
  assets/              local geometric wallpaper
tests/                 browser interaction and layout verification
docs/                  durable engineering records
```

A small feature may keep closely related components together. Extract shared primitives when they have clear reuse; avoid generic configuration frameworks.

## Data and presentation flow

The application composes the authentication feature. The feature owns active view and transient notices. Forms use native input state and collect typed login or registration values with FormData on submit, then invoke callbacks. Visual primitives accept values, events, labels, and appearance without knowing about authentication services.

For this delivery, submit callbacks only show a neutral preview notice. There is no fake authenticated state. Inputs keep useful type/autocomplete semantics, but forms deliberately use noValidate; validation rules, loading protocols, error contracts, and API shapes are future requirements.

Future flow: form → validation → service boundary → backend. Preserve typed submission callbacks so the presentation can be connected without redesigning it. Do not invent an endpoint, database schema, token strategy, or session API today.

## State and motion

useAuthTransition owns mode and short exit/enter phases, ignores repeated activation during the active transition, and clears its timer on unmount. CSS keyframes handle presentation. The outgoing view becomes inert; a keyed replacement removes the old form and resets its values. After switching, focus the incoming heading. The wallpaper and shell stay fixed while content and the lighter panel change sides.

See [ADR index](DECISIONS.md), [component guidance](COMPONENT_GUIDELINES.md), and [architecture overview](docs/architecture/overview.md).

## Wallpaper and frost

The screen and a noninteractive layer inside the card reference the same local SVG. The card layer is overscanned, tinted, and CSS-filtered for consistent frost across engines; the shell clips its edges. Native backdrop-filter remains enabled where supported, while unsupported engines receive an opaque charcoal surface. This is a presentation detail with no new asset or dependency.
