# Authentication foundation handoff — 2026-10-09

## 1. Inspection and scope

Frontend inspected before implementation: React 19.3, TypeScript 6.0, Vite 8.3, npm, CSS Modules/Tailwind. Local auth state plus public gallery hash/query routing; no API client. AuthForm supplied Login/Register, RecoveryModal the existing four-step OTP UI. Backend folder was absent. Existing uncommitted recovery and documentation changes were preserved and extended. The user's brief superseded earlier static-only restrictions. **Docker work is deferred until the final stage; no Docker files, commands or container setup were added.**

## 2. Important files created

Backend source/configuration:

- `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.test.json`, `eslint.config.mjs`, `.gitignore`, `.env.example`, `AGENTS.md`.
- `prisma/schema.prisma`, `prisma/migrations/20261009000000_foundation/migration.sql`, migration lock and `prisma/seed.ts`.
- `src/main.ts`, `src/worker.ts`, `src/app.module.ts`, `src/config/app-config.ts`.
- `src/common/core.module.ts`, `common/http/{configure-app,exception.filter,request-context}.ts`, `common/errors/api-error.ts`, `common/security/crypto.ts`, `common/idempotency/idempotency.service.ts`, `common/guards/{auth,permissions,rate-limit}.guard.ts`, `common/decorators/require-permissions.ts`, `common/health/health.controller.ts`, `common/observability/metrics.service.ts`.
- `src/modules/auth/{auth.module,auth.controller,auth.service,auth.dto,security}.ts`; users, roles, permissions and notifications module/service pairs.
- `src/infrastructure/database` and `redis` module/service pairs; `email` module/service; `queue/{queue.module,outbox-dispatcher.service,outbox-processor.service}.ts`.
- `test/unit/{auth-security,auth-transitions,infrastructure}.test.ts`, `test/integration/auth.integration.test.ts`.
- `scripts/{configure-local,migrate-test,run-integration,mail-dev}.cjs`; README and `docs/{api,database,architecture,operations,handoff}.md`.

Frontend: `.env.example`, `src/features/auth/authApi.ts`, `playwright.live.config.ts`, `tests/live/auth.live.spec.ts`, `tests/session-revocation.spec.ts`, `docs/architecture/backend-integration-plan.md`. The preexisting untracked ADR 0009 belongs to the earlier recovery work.

## 3. Existing files modified

Frontend: `src/features/auth/{AuthForm.tsx,AuthScreen.tsx,AuthScreen.module.css,RecoveryModal.tsx,RecoveryModal.module.css,WelcomePanel.tsx,types.ts}`, `vite.config.ts`, `playwright.config.ts`, `tsconfig.json`, `package.json`, `tests/auth.spec.ts`. No frontend dependencies or framework were replaced; no existing files were deleted.

Project memory/guidance: AGENTS, AI_CONTEXT, AI_RULES, PROJECT_RULES, ARCHITECTURE, COMPONENT_GUIDELINES, ACCESSIBILITY, UI_SYSTEM, README, DEVELOPMENT_WORKFLOW, SECURITY, TESTING, CHANGELOG, TODO, project_state, DECISIONS, LESSONS_LEARNED, feature authentication and UI verification docs. Historical records remain visible with explicit superseding context.

## 4. Database

All 13 requested core tables implemented with relationships/indexes in [database documentation](database.md). Unsigned BIGINT keys; public UUID identities; nullable unique email/phone; profile one-to-one; role/permission join keys; soft deletion and DATETIME(6); query-aligned indexes. Additional fields support challenge invalidation, public IDs, leases and durable retry receipts without inventing a fourteenth domain table.

Migration applied to native MySQL 8.4.10 databases `glass_auth` and `glass_auth_test`. Inspection confirmed all tables InnoDB/utf8mb4_unicode_ci and server timezone `+00:00`. Each database contains 13 core tables plus Prisma's migration bookkeeping table. Generate: `npm run prisma:generate`; migrate: `npm run db:migrate`; seed: `npm run db:seed`. Existing XAMPP MariaDB on port 3306 was untouched.

## 5. APIs

POST `/api/v1/auth/`: `signup`, `verify-email`, `resend-verification`, `login`, `refresh`, `logout`, `logout-all`, `forgot-password`, `verify-reset-otp`, `reset-password`. GET `/api/v1/auth/me`. GET `/health/live`, `/health/ready`, `/metrics`. See [request/response contract](api.md).

## 6. Authentication

Signup commits pending user/profile/default role/challenge/outbox/receipt. Worker sends OTP. Verification activates the user. Login creates a session and returns an in-memory access JWT plus an HttpOnly refresh cookie. Refresh rotates opaque tokens; replay revokes that session family. Logout revokes current session; logout-all revokes all. Recovery uses a generic email response, bounded OTP verification, a single-use reset token and transactional password replacement/session revocation. Existing UI advances only on server-confirmed success. Session confirmation stays at `/` because there is no authenticated business destination yet.

## 7. Infrastructure

Singleton Prisma pools default to ten connections/process. Redis shares atomic IP/account limits and request coordination. Durable cooldowns/attempts/receipts remain in MySQL. BullMQ worker polls/leases outbox rows, queues only event IDs, retries with exponential backoff and preserves FAILED rows for review. SMTP and optional Resend adapters exist; local tests use an in-memory SMTP receiver, with no external mail. Local-only email viewer at `127.0.0.1:8025` makes manual signup/recovery usable. SMTP has an explicitly documented at-least-once delivery window.

## 8. Security

Argon2id hashing; independent environment secrets; HMAC token/OTP hashes; encrypted durable reset-response receipts; no stored plaintext passwords/codes/bearer tokens. JWT algorithm/issuer/audience/expiry and database session checks; strict DTOs; exact CORS; JSON/Origin checks; production Secure cookies; trusted-proxy allowlist; bounded body and configurable rate limits. Safe request IDs/logs/audits; protected production metrics. RBAC seed and guards provide a foundation without unrequested administration routes. The [security skill](C:/Users/srira/.codex/plugins/cache/antigravity-awesome-skills/antigravity-awesome-skills/10.5.0/skills/api-security-best-practices/SKILL.md) informed review; user requirements took precedence over illustrative snippets.

## 9. Verification

- Backend strict type checking, ESLint, build and 22 unit tests passed.
- Real MySQL/Redis/BullMQ/local SMTP suite passed all eight scenario groups (nine Node test entries including the parent). Covers duplicate/retried signup, encrypted receipts, delivered OTP, persisted attempts, expiry, concurrent verification, invalid login, rotation/reuse, per-device logout, logout-all, recovery cooldown/brute force, reset single-use/whitespace, revocation, audit context, origin/validation/health/metrics.
- Prisma validation/generation, actual migrations and default-role seed passed. Full dependency audit and production dependency audit reported zero vulnerabilities after the targeted deepmerge-ts override.
- Live Chromium browser flow passed signup → actual local email → verification → login → reload/refresh → logout → recovery → password reset → new-password login → logout-all. Browser local/session storage remained empty.
- Desktop Login/Register/session and mobile recovery captures were inspected; existing glass/3D styling remains intact. Keyboard containment defect fixed. Firefox synthetic clipboard fixture corrected after direct engine inspection.
- Final 60-case production-preview browser suite status is recorded in the frontend `docs/ui/verification.md`. Earlier development-server runs were interrupted by Vite reloads; do not interpret those as an all-green suite.

## 10. Run instructions

See [README](../README.md) for exact native MySQL/WSL Redis start commands, install/generate/migrate/seed, API/worker/local email viewer/frontend startup and unit/integration/live-browser tests. Current local API is `http://127.0.0.1:3000`, frontend `http://127.0.0.1:5173`, mailbox `http://127.0.0.1:8025`. Ignored local `.env` and `.local` contain development-only configuration; templates contain no real secrets.

## 11. Remaining work

Docker/containerization only when the user begins the final stage. No production deployment, load-test capacity claim, real-provider deliverability validation, production secret rotation/retention/backups/HA/exporters/alerting rollout, or independent security assessment. The code and capacity plan support horizontal API/worker scaling; neither 10K nor 100K capacity is certified. No orders/products/payments or other business modules, social login, phone authentication, or business dashboard were invented. Frontend password guidance reflects the default policy; coordinate it when changing PASSWORD_MIN_LENGTH.
