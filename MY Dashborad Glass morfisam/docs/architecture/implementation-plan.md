# Approved implementation plan

Date: 2026-10-08. This records the agreed implementation order and acceptance target.

1. Create the complete documentation framework, prompt templates, reference analysis, design system, architecture records, and component responsibilities before application code.
2. Initialize React/TypeScript/Vite, CSS Modules, ESLint, and Playwright; explain dependency purposes and preserve the lockfile.
3. Create shared tokens and the local SVG geometric wallpaper, then the centered card shell and shared controls.
4. Build Login and registration with typed submissions, neutral static notices, password visibility, and account switching.
5. Add approximately 200 ms exit / 400 ms entry motion, stationary shell/wallpaper, heading focus, reduced-motion support, and robust repeated switching.
6. Adapt below 768 px to a stacked form/welcome layout with 16 px inputs, practical touch targets, and vertical scrolling.
7. Review and verify type checking, lint, production build, three browser engines, accessibility interactions, privacy boundary, responsive sizes, and reference comparison.
8. Fix observed findings, update all affected project memory, and provide a concise factual handoff.

Success means a reference-matched static experience and a usable long-term development framework. It does not mean exact source wallpaper/font reproduction or functioning authentication.

Dependencies: React and React DOM render and coordinate components; TypeScript checks contracts; Vite and its React plugin provide development/build integration; ESLint and its TypeScript/React configuration packages catch code issues; Playwright verifies browser interactions and captures visual evidence. No animation, routing, state, form, HTTP, or icon library is needed.

## Selected package compatibility

Registry inspection selected React 19.3.0, Vite 8.3.3 with React plugin 6.1.2, TypeScript 6.0.3, ESLint 10.12.0, typescript-eslint 8.71.1, React hooks lint plugin 7.1.1, React refresh lint plugin 0.5.7, and Playwright 1.64.0. TypeScript 7.0.2 was not selected because the TypeScript ESLint tooling supports versions below 6.1. Vite and its plugin require Node ^20.19 or >=22.12, which includes the observed Node 22.20.0. The lockfile will record exact installed resolution; this list records the compatibility decision before installation.
