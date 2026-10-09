# Rules for AI agents

Purpose: govern agent behavior without duplicating the architecture or command reference.

1. Read AGENTS and relevant project documentation before modifying code. Inspect the current architecture and existing components before creating files.
2. Follow the required process stages. Do not skip reference analysis or documentation updates.
3. Preserve working code and behavior; avoid unnecessary rewrites. Do not remove functionality without explicit user authorization.
4. Reuse established components and tokens. Do not introduce duplicates or bypass naming and design conventions.
5. Keep business logic separate from UI primitives and keep reusable components independent of feature-specific rules.
6. The user authorized the 13-table backend foundation on 2026-10-09. Keep later schema expansion bounded by actual requirements.
7. Introduce only justified dependencies and explain each dependency's purpose before installation.
8. Explain the architectural impact of major changes and record meaningful decisions with alternatives and tradeoffs.
9. Update affected docs after meaningful changes; keep AI_CONTEXT concise and accurate.
10. Run relevant checks before declaring completion. Report failed, unavailable, or unperformed checks honestly.
11. Distinguish reference observations, approved adaptations, assumptions, and measured implementation results.
12. Never fabricate discoveries, failures, test results, or implementation status.
13. Connect authorized real authentication while preserving UI. Do not invent dashboard/business modules or deploy. Docker is deferred until the final stage.
14. Continue authorized, reversible work without unnecessary permission requests. Explicit user scope and later instructions take precedence over local guidance.

Use [AI_DEVELOPMENT.md](AI_DEVELOPMENT.md) for memory and collaboration practices.
