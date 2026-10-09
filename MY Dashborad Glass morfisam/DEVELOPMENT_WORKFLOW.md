# Development workflow

## Connected authentication - 2026-10-09

Start native MySQL/Redis, API and email worker from the sibling backend README, then `npm run dev` here. Vite proxies `/api` and `/health` to port 3000. `.env.example` documents optional origin settings. Keep browser host and CORS hosts consistent. Docker is deferred.

Contract browser tests now build and start an isolated production preview on port 4173 (no reused Vite/HMR server). `npm run test:live` separately uses the real backend and local email viewer through the development frontend on 5173.

Current browser output paths: `artifacts/preview/playwright-report` and `artifacts/preview/test-results`; older paths below are historical. Browser contract tests mock responses while preserving layout/motion checks. Backend integration separately exercises real MySQL/Redis/BullMQ/local SMTP.

Purpose: provide commands and repeatable local procedures. [PROCESS.md](PROCESS.md) governs when each procedure is required.

## Setup

Use Node >=22.20.0 as required by package.json, and npm. Install dependencies with `npm install` on initial setup and `npm ci` with an existing lockfile. Install browser engines with `npx playwright install`; Playwright may require network access on first setup.

The application exposes:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite local development server |
| `npm run typecheck` | TypeScript validation without emitted application files |
| `npm run lint` | ESLint checks without rewriting files |
| `npm run build` | Type checking and production assets |
| `npm run preview` | Serve production output locally |
| `npm run test:e2e` | Browser tests across configured engines |

Development serves on http://127.0.0.1:5173 by default; Vite may select another available port. Preview normally serves on http://127.0.0.1:4173 after a build. Playwright uses strict port 5173 and reuses an existing local server, so confirm that server is this application. Use npm run check for lint, build/type checking, and the full browser suite. HTML reports are written to artifacts/playwright-report and failed-test screenshots/traces to artifacts/test-results.

## Work loop

Read the relevant docs, inspect existing components, record the intended change, and implement the smallest cohesive update. Review the diff for unrelated edits, duplication, and sensitive data. Run relevant checks and visually inspect affected states. Fix findings, update project memory, then run final verification.

For a visual change, include desktop Login and registration screenshots and affected responsive sizes in the local review. Generated screenshots and reports are verification artifacts, not automatically approved baselines.

## Handoff

State the behavior delivered and checks actually run, including failures or unavailable browser engines. Update [CHANGELOG.md](CHANGELOG.md), [AI_CONTEXT.md](AI_CONTEXT.md), and [TODO.md](TODO.md). Add architectural records or lessons only when there is new evidence.
