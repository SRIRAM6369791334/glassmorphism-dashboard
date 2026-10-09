# Database foundation

MySQL 8+, InnoDB, utf8mb4, UTC, DATETIME(6). `prisma/schema.prisma` maps the following 13 models to snake_case tables; Prisma additionally maintains its own `_prisma_migrations` bookkeeping table.

| Table | Relationships and query indexes |
| --- | --- |
| users | Unsigned BIGINT PK; unique public UUID/email/phone; status index; nullable identity fields and soft deletion |
| user_profiles | Unique user_id one-to-one; names/image/date/gender and soft deletion |
| roles | Unique name; system flag |
| permissions | Unique name and `(resource,action)` |
| user_roles | Composite user_id/role_id PK; role lookup index |
| role_permissions | Composite role_id/permission_id PK; permission lookup index |
| email_otps | User FK, unique challenge UUID, `(user_id,purpose,created_at)` and expiry indexes; hashed code, attempts, consumed/invalidated timestamps |
| password_reset_tokens | User FK; unique keyed token hash; user/expiry indexes; used timestamp |
| refresh_tokens | User/session FKs; unique keyed hash; user/session/expiry indexes; revoked timestamp retained for reuse detection |
| user_sessions | User FK; unique public UUID; `(user_id,revoked_at)` and expiry indexes |
| audit_logs | Optional user FK; `(user_id,created_at)`, `(action,created_at)`, created_at indexes; safe JSON metadata |
| notifications | User FK; `(user_id,read_at,created_at)` index; JSON data |
| outbox_events | Polymorphic aggregate UUID, JSON payload, unique optional dedupe_key, `(status,available_at)` index, leases and attempts |

All timestamps use UTC Date objects. Configure MySQL's server `default-time-zone=+00:00` for pooled connections; migration's UTC statement only applies to its own session. BIGINT IDs never enter JSON responses directly. Foreign-key delete behavior is explicit; application soft-deletes identities.

`20261009000000_foundation/migration.sql` is generated from the schema with explicit InnoDB/charset and UTC preamble. Apply with `npm run db:migrate`, generate the client with `npm run prisma:generate`, and seed default USER/ADMIN roles and six foundation permissions with `npm run db:seed`. Seed creates no administrator account and is repeatable. A module requesting a permission must use AuthGuard followed by PermissionsGuard and the permission decorator; ownership checks are still required.

Auth mutations serialize on the user row using SELECT FOR UPDATE inside READ COMMITTED transactions. Conditional token/challenge updates add consistency protection. Expensive password hashing runs before acquiring row locks; login rechecks the verified password hash under lock to detect a racing password reset.

Durable request receipts share `outbox_events` with event_type REQUEST_RECEIPT and COMPLETED status. The operation and encrypted result commit in the same transaction. Only keyed request fingerprints are stored; passwords are never recorded. Responses containing reset tokens are AES-GCM encrypted. Expired receipts remain tombstones to prevent accidental re-execution. Establish an explicit receipt retention policy before production; deleting tombstones changes retry guarantees.

Connection pooling is a singleton Prisma client per process, default 10 connections with a 10-second pool timeout. `DB_POOL_SIZE` is bounded and must be tuned across all API/worker replicas against MySQL's max_connections. Do not allocate 10K database connections for 10K users.
