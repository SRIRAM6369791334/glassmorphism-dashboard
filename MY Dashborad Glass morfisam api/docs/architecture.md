# Authentication architecture

The API and worker use one modular monolith codebase and separate process entrypoints. React remains in its existing directory/framework. No business domain, dashboard, microservices or containerization is invented.

Auth owns credentials, challenge consumption, sessions and rotation. Users defines the safe public user projection. Roles/permissions provide RBAC assignment and guards. Notifications provides transaction-aware persistence for future modules, without invented public routes. Infrastructure supplies Prisma, Redis, BullMQ and SMTP/Resend. Generic React controls remain unaware of network/session logic.

## Security and consistency

Passwords use Argon2id (19 MiB, two iterations, one lane) with independent salts; policy is configurable. Rate-limit before expensive hash operations. Load-test hash concurrency and add upstream admission limits before production. Tokens use 256 random bits; MySQL stores HMAC-SHA256 digests. Access JWTs are HS256 with explicit algorithm, issuer and audience. Active-user/session database checks enforce immediate revocation even for unexpired JWTs.

Refresh rotates tokens under a user lock. Reusing a revoked refresh token commits session-family revocation before returning an error. Other device families remain active. Password reset consumes a short-lived token, changes the password, and revokes sessions/refresh/reset tokens and reset challenges atomically. Invalid OTP attempts are committed, not rolled back with the client error.

OTP challenges have random UUIDs. A separate HMAC secret derives the six-digit code from that UUID for both API validation and worker email delivery. Only a challenge-bound keyed hash is stored, never plaintext codes or reversible OTP payloads. The worker skips used/expired/superseded challenges. Rotate OTP_SECRET only after outstanding challenges expire or intentionally invalidate them. Email-provider transport necessarily handles codes; logs/Redis/database must not.

Redis supplies atomic account/IP rate counters and short-lived idempotency coordination. MySQL is authoritative for users, challenge cooldowns, sessions and request receipts. A Redis restart cannot duplicate a committed write or bypass the durable OTP attempt counter. Redis failure fails auth traffic closed. Redis locks are hints; unique receipt constraints protect requests even when locks expire. Do not store tokens or request bodies in Redis.

HTTP middleware enforces exact-origin CORS, JSON mutation content types, cookie-origin checks, 16 KiB request bodies, safe errors, security headers and generated request IDs. Configure exact trusted proxy networks; otherwise forwarded IP headers are ignored. Production cookies require HTTPS and same-site frontend/API origins. No localStorage/sessionStorage credentials.

## Asynchronous delivery

Auth transaction writes domain data and an outbox event. The worker leases due rows, queues only outbox IDs, and claims each delivery through a database lease. It renews leases, records attempts, backs off exponentially, sanitizes persisted errors, and marks exhausted rows FAILED. MySQL rows survive Redis job loss; expired dispatch/delivery leases allow recovery. Unknown events fail explicitly. USER_CREATED/PASSWORD_RESET events currently acknowledge without invented domain side effects.

SMTP is at-least-once: a crash after SMTP acceptance but before recording completion may send the same code again. A stable Message-ID reduces accidental duplication but does not prove exactly-once delivery. The optional Resend adapter sends a stable provider idempotency key; respect its provider retention window. Operator replays must preserve the original event ID. Alerts and a reviewed replay procedure are required before production.

## References used

[Nest authentication](https://docs.nestjs.com/security/authentication), [Prisma v6 MySQL connector](https://docs.prisma.io/docs/orm/v6/overview/databases/mysql), [Prisma connection pooling](https://www.prisma.io/docs/orm/v6/prisma-client/setup-and-configuration/databases-connections/connection-pool), and [BullMQ idempotent jobs](https://docs.bullmq.io/patterns/idempotent-jobs) informed the implementation. Framework versions are pinned in package-lock.json. Security review used the installed api-security-best-practices skill, with the user's Argon2id/hash-only requirements taking precedence over its illustrative examples.
