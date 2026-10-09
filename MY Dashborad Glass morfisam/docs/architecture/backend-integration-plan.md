# Backend integration — 2026-10-09

## Requirement and inspection

The user authorized the attached backend/authentication foundation brief and explicitly deferred all Docker work until the final stage. This supersedes earlier static-only restrictions. No deployment or business-domain modules are authorized. Preserve existing uncommitted OTP UI work.

Inspected: React 19, TypeScript, npm, Vite, CSS Modules/Tailwind; local auth state; public component gallery via hash/query; no API/client, environment configuration or backend. Login/signup use AuthForm. RecoveryModal contains a simulated four-step OTP flow. The sibling API folder did not exist. No MySQL/Redis executable was found on PATH during initial inspection.

## Reference analysis and component design

Existing glass card, wallpaper, prism fields/buttons, particle cursor, motion and gallery remain the reference. Reuse RecoveryModal for signup verification and recovery. Only email identity wording, real pending/error feedback, verification and signed-in session actions change. Keep business/session logic in feature services, outside visual primitives. Improve modal focus, close cleanup and resend timing while preserving styling.

## Architecture decision

Separate sibling NestJS modular monolith, Prisma/MySQL with the specified 13 foundation tables, Redis coordination, BullMQ worker and transactional outbox. Stateless API processes share durable MySQL state and distributed limits. Short-lived JWT access token remains in browser memory; opaque rotating refresh token lives in an HttpOnly SameSite cookie. Database session checks enforce revocation. No new frontend framework/router or dashboard.

Important writes use Redis coordination plus encrypted durable request receipts in the existing outbox table, committed with the operation, so a lost response can be retried safely. OTPs are derived from a random challenge ID and a server HMAC key for background delivery; only their keyed hashes are persisted. Jobs contain event IDs, never credentials. SMTP is at-least-once delivery, with the duplicate window documented.

## Implementation plan

1. Create backend package/config, 13-table schema/migration, shared database/Redis services.
2. Implement auth, session rotation/replay revocation, OTP/password recovery, RBAC, safe errors, request IDs, validation, limits and receipts.
3. Implement separate outbox/queue/email worker, health/metrics and setup/architecture/database/API/load-test docs.
4. Connect existing React forms and modal through feature-local client; add controlled retries and honest session feedback.
5. Run static/build/unit checks and database/browser integration when local dependencies permit; inspect desktop/mobile/modal states.
6. Fix findings, synchronize project memory and record exact verification limitations.

Docker files, commands and container setup are intentionally excluded. Capacity targets are design goals until independently load-tested.
