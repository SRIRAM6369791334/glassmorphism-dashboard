# Glassmorphism Auth Dashboard

Authentication now connects to the sibling NestJS backend (`../MY Dashborad Glass morfisam api/README.md`): signup/email OTP, login, refresh/logout and OTP recovery. React/Vite and the glass design are preserved. Start native MySQL/Redis, API and email worker using its README, then `npm run dev` here. Docker is deferred until the final stage. See [integration plan](docs/architecture/backend-integration-plan.md) and [verification](docs/ui/verification.md). The original static description below is historical.

A modern static Login/Register and interactive dashboard experience built with React 19, TypeScript, and Vite. A black geometric wallpaper sits behind a frosted charcoal glass card with animated diagonal divider, interactive specular mouse-following border glow, custom Lightswind-style Glowing Cards, and an ultra-smooth physics-based Particles Cursor.

The repository also contains the AI development framework requested for long-term maintenance: [AGENTS.md](AGENTS.md) is the entrypoint.

## Features

- **Downside 3D Isometric Buttons**: Core action buttons (`Login`, `Create Account`, `Sign in`, `Sign Up`) engineered with pure CSS 3D prisms, downside bevel extrusion, responsive spring hover/press physics, and glowing purple floor reflections.
- **3D Glass Prism Input Fields**: `Username`, `Password`, `Full Name`, and `Work Email` inputs elevated with tactile 3D bevels, top highlight edge, and radiant neon purple floor reflections on focus.
- **DesignPass.dev Spring Physics Suite**: 6 modular spring-physics components (`IsometricButton`, `LiquidGlass`, `Magnet`, `SpringSelect`, `SpringSlider`, `SpringAccordion`).
- **Interactive Component Gallery (19 components)**: Live interactive showcase (`#/components`) with instant search, category filters, interactive previews, and copyable code snippets.
- **Interactive Particles Cursor**: Physics-simulated particle trail trailing the mouse with inertia, velocity dispersion, touch interpolation, and zero-CPU idle suspension.
- **Specular Glassmorphism Card**: Mouse-following radial gradient glow illuminates the glass border and surface on cursor movement.
- **Accessible & Tested**: WCAG compliant, keyboard focus transfer, full `prefers-reduced-motion` support, and robust Playwright test coverage passing with 100% green status.

## Run locally

Use Node 22.20.0 or later and npm.

```powershell
npm ci
npm run dev
```

Open **http://127.0.0.1:5173** (or the port Vite reports if it is occupied). To inspect the production build:

```powershell
npm run build
npm run preview
```

Vite preview normally uses **http://127.0.0.1:4173**.

## Verify

```powershell
npm run typecheck
npm run lint
npm run build
npx playwright install
npm run test:e2e
```

`npm run check` runs lint, build/type checking, and browser tests together. Playwright covers Chromium, Firefox, and WebKit. See [verification](docs/ui/verification.md) for actual results and limits.

## Implementation

React 19.3, TypeScript 6.0.3, Vite 8.3.3, CSS Modules, ESLint, and Playwright. One screen at `/` starts with Login. Both account-switch actions, typed form input, password visibility, keyboard access, reduced motion, and neutral preview notices are implemented. Below 768 px the form stacks above the welcome panel.

This is a UI preview: Login, Sign Up, and recovery send no request and persist no credentials. Backend authentication, validation, database, protected routes, and deployment are future work. The wallpaper is a local SVG approximation; Arial approximates the unidentified original font.

## Project guide

[PROCESS.md](PROCESS.md) defines the mandatory development stages. [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) provides commands. [ARCHITECTURE.md](ARCHITECTURE.md) describes boundaries, [UI_SYSTEM.md](UI_SYSTEM.md) defines the design, and [AI_CONTEXT.md](AI_CONTEXT.md) provides the latest handoff.

Detailed documentation covers [architecture](docs/architecture/overview.md), [features](docs/features/authentication-ui.md), [reference analysis](docs/ui/reference-analysis.md), [decisions](DECISIONS.md), and [troubleshooting](docs/troubleshooting/local-development.md). Reusable task prompts live in [PROMPTS](PROMPTS/).
