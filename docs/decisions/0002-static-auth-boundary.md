# ADR 0002 — Static forms and future integration

## Context

The user explicitly requests static Login/Register UI now and a clean path to future backend work.

## Options considered

- Implement real authentication immediately: exceeds scope and lacks backend requirements.
- Build inert form artwork: matches layout but provides insufficient interaction and integration structure.
- Use typed interactive forms with local preview feedback: fulfills the current UI and preserves a service connection point.

## Selected approach

Forms expose typed values and submission callbacks. Current callbacks show neutral unconnected-authentication notices. Recovery shows an equivalent notice. Input data remains transient; no credential requests, logging, or persistence occurs.

## Reason

The UI behaves coherently without implying a real account operation. A future validation/service adapter can connect through the callback boundary.

## Trade-offs

Submitting does not log in or create an account. API schemas, sessions, tokens, validation rules, loading and error contracts, and protected routes remain future decisions rather than speculative code.

## Date

2026-10-08. Status: accepted.
