# Backend working agreement

Read README.md and docs before changing behavior. This NestJS sibling API implements the user's 2026-10-09 authentication foundation brief. Docker work is explicitly deferred to the final stage. Do not add container files or run Docker commands.

Preserve the React UI in the sibling frontend. Use the 13 approved foundation tables only, strict TypeScript, transactional authentication/outbox writes, database-authoritative state, distributed rate limiting, safe logs and generic errors. Never persist plaintext passwords, codes or bearer tokens. Real external email/deployment requires explicit authorization. Run relevant checks and record actual outcomes rather than treating documentation as test evidence.
