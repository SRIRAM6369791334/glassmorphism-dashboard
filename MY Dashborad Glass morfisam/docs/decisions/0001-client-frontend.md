# ADR 0001 — Client frontend and dependencies

## Context

The empty project needs a reusable component foundation for a single static authentication screen, with future backend integration and sustained AI-assisted development.

## Options considered

- Plain HTML/CSS/JavaScript: minimal tooling, but weaker typed contracts and component scaling.
- React with TypeScript and Vite: explicit reusable components, fast local development, typed interfaces, and a small client build.
- A server-rendered framework: useful for server features and content SEO, but unnecessary complexity for the current static screen.

## Selected approach

React and React DOM, TypeScript, Vite with its React plugin, CSS Modules/custom properties, ESLint, and Playwright. Use npm and preserve its lockfile. Use local state, CSS motion, and inline icons.

## Reason

These tools directly support the requested architecture, shared controls, future typed submissions, and browser verification without forcing backend or routing decisions.

## Trade-offs

The page is client rendered and carries React runtime overhead. There is no server authentication or SEO-focused rendering. Routing, global state, form, HTTP, and animation libraries remain deferred. Every installed tooling package must have a documented purpose.

## Date

2026-10-08. Status: accepted in the user-approved implementation plan.
