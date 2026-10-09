# Operations and capacity plan

## Current boundaries

This is a working foundation with functional/security tests. It has not been load-tested at 10,000 or 100,000 concurrent users and is not a production capacity certification. Docker/container work is explicitly deferred to the final stage. No deployment has occurred. Future business modules, social/phone/passwordless login, real-provider deliverability and final hosting topology remain unspecified.

## Starting limits and metrics

Default per-60-second windows: login 10, OTP send/signup 5, verification/reset 10, forgot password 5, normal API 120. Auth routes apply both per-IP and per-normalized-account counters. They are conservative development defaults, all environment configurable. Tune for legitimate shared networks and upstream edge rate limits with measured attack/usage data. OTP additionally has a durable 60-second resend cooldown and five attempts per challenge. Access TTL 15 minutes, refresh/session absolute TTL 30 days, reset TTL ten minutes, OTP TTL five minutes.

Structured logs contain generated request IDs, route templates, statuses, durations and safe event names. Request bodies, authorization/cookie headers, exception objects and provider responses are not logged. Audit rows hold allowlisted context only. API `/metrics` provides counts/status/latency, process CPU/memory/event loop, dependency probe latency, Prisma query duration, DB connected threads, Redis hits/misses/memory and BullMQ queue depth. Worker emits attempt/failure/duration and queue-depth JSON metrics. Deploy a log-to-metrics collector and MySQL/Redis exporters for server CPU and detailed pool telemetry; these external collectors are not installed by this foundation.

## Load-test protocol

1. Use an isolated staging database, queue namespace and local/sandbox email receiver. Seed distinct verified accounts and realistic session counts. Never load-test an unapproved production target.
2. Baseline one API/worker instance. Specify arrival rate, virtual users, think time and request mix separately: connected/active users are not requests per second.
3. Exercise login, refresh, signup/OTP and recovery independently. Measure Argon2 concurrency and memory before mixing workloads. Match per-account serialization to realistic distinct users.
4. Ramp at 100, 500, 1K, 5K and 10K active virtual users with bounded stages. Record achieved RPS, p50/p95/p99, 4xx/5xx, CPU/memory/event-loop delay, DB CPU/locks/connections/pool waits, Redis CPU/memory, queue depth/oldest age and delivery latency.
5. Set and agree SLOs before acceptance (provisional: 5xx <0.1%, interactive p95 <500ms excluding email wait). Abort on sustained errors, memory pressure or unbounded queues. Keep raw results and host specifications.
6. Compare API replicas 1/2/4 while keeping total DB pool budget below capacity. Introduce bounded worker scaling separately. Soak at target workload and test lost responses, Redis interruption, DB saturation, worker crashes, duplicate jobs, token rotation races and multi-tab sessions.
7. Progress toward 100K only after measured bottlenecks are addressed: load balancing, MySQL HA/backups, tuned pools/indexes, Redis HA, email-provider quotas, admission control, CDN/static frontend and workers. Authentication/session writes and revocation checks must use the primary; replicas cannot safely serve stale security state. Extract services only for demonstrated ownership/scaling requirements.

## Before production

Set HTTPS origins, secure secrets/rotation, exact proxy trust and scoped runtime DB/Redis accounts; separate migration privileges from runtime. Require encrypted dependency connections where network boundaries demand them. Put health/metrics behind appropriate network controls. Verify backup restoration, retention for sessions/challenges/audit/outbox receipts, failed-job alerts and reviewed replay tools. Document Resend/SMTP delivery guarantees and test real-provider behavior with authorization. Run external observability/alerting and independent security review. Keep API and workers separate under a supervisor with graceful shutdown. Add containerization only when the user begins that final stage.
