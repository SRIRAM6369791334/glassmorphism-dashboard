# HTTP contract

Public endpoints use `/api/v1`. Success responses are `{ "success": true, "data": ... }`. Errors are `{ "success": false, "code": "...", "message": "...", "requestId": "req_..." }`; clients display known safe messages. Every response includes `X-Request-Id` and `Cache-Control: no-store`. Use JSON requests; browser origins must match configured origins.

| Method/path | JSON input | Result |
| --- | --- | --- |
| POST `/auth/signup` | `email`, `password`, `firstName`, optional `lastName`, `phone` | 201 generic eligibility message; pending user/profile/role/OTP/outbox committed together |
| POST `/auth/resend-verification` | `email` | Generic message; default 60-second durable cooldown |
| POST `/auth/verify-email` | `email`, `otp` | Activates pending user; consumes challenge |
| POST `/auth/login` | `email`, `password` | `accessToken`, `expiresIn`, `user`; refresh cookie |
| POST `/auth/refresh` | `{}` plus cookie | New access token and rotated refresh cookie |
| POST `/auth/logout` | `{}` plus bearer access token | Revokes current session and clears cookie |
| POST `/auth/logout-all` | `{}` plus bearer access token | Revokes all sessions and clears cookie |
| GET `/auth/me` | Bearer access token | `{id,email,displayName}` of active session's owner |
| POST `/auth/forgot-password` | `email` | Same generic message for eligible and unknown accounts |
| POST `/auth/verify-reset-otp` | `email`, `otp` | Short-lived `resetToken`, `expiresIn` |
| POST `/auth/reset-password` | `resetToken`, `newPassword` | Changes password; consumes token and revokes sessions |

All POSTs return 200 except signup (201). Required `Idempotency-Key` header on signup, resend, email verification, forgot password, reset OTP verification and password reset: 16–128 alphanumeric/hyphen/underscore characters, preferably UUID. Reuse the same key and identical payload after a timeout, `REQUEST_IN_PROGRESS` or 503. A completed operation returns its saved result. A changed payload gets 409 `IDEMPOTENCY_CONFLICT`; expired receipts return 409 `IDEMPOTENCY_EXPIRED`, never re-execute. Default replay window: 24 hours. Invalid-code retries with the same key do not consume extra attempts. Use a new key for a new attempt/code.

Do not automatically retry login/refresh. If a refresh response is lost, the old cookie may trigger reuse detection on retry; sign in again. Logout endpoints are revocations, but clients do not blindly replay them with expired credentials.

The `glass_refresh` cookie is HttpOnly, SameSite=Strict, scoped to `/api/v1/auth`, and Secure in production. Access JWTs contain subject/session identifiers plus issuer/audience/expiry, and live only in memory. Reset tokens also remain in memory. Refresh tokens are opaque, so there is no redundant JWT_REFRESH_SECRET. `TOKEN_HASH_SECRET` protects stored token digests instead.

Validation rejects extra fields and malformed email/phone/OTP/token input. Passwords preserve whitespace, default to 12–128 characters, and use the server-configured minimum. Phone is optional E.164 metadata only; phone authentication is deferred. Email is normalized to lowercase. IDs returned to clients are UUIDs, separate from database keys.

Liveness: GET `/health/live`. Readiness: GET `/health/ready` checks MySQL and Redis. Internal GET `/metrics` uses bearer `METRICS_TOKEN` in production and should be restricted by network policy. Rate-limit responses use 429 with `Retry-After`; normal and account/IP auth counters are shared in Redis. No account recovery or authentication result is simulated.
