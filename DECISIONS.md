# Architecture decision index

Purpose: maintain dated, reviewable architecture decisions. Each record contains context, options, selected approach, reason, tradeoffs, and date. Supersede records explicitly instead of rewriting their history.

| Date | Record | Status |
| --- | --- | --- |
| 2026-10-08 | [0001 — Client frontend and dependencies](docs/decisions/0001-client-frontend.md) | Accepted |
| 2026-10-08 | [0002 — Static forms and future integration](docs/decisions/0002-static-auth-boundary.md) | Accepted |
| 2026-10-08 | [0003 — Reference fidelity and responsive adaptation](docs/decisions/0003-reference-design.md) | Accepted |
| 2026-10-08 | [0004 — Documentation as project memory](docs/decisions/0004-project-memory.md) | Accepted |
| 2026-10-08 | [0005 — DesignPass.dev modular spring components and hybrid styling](docs/decisions/0005-designpass-components.md) | Accepted |

The user approved these choices in the implementation request. Routine work within this scope does not need an additional approval cycle.

## Implementation review — 2026-10-08

The selected boundaries are implemented without additional architecture dependencies. Typed submissions use username/password and fullName/email/password; validation and backend contracts remain deferred. The local wallpaper and glass are being tuned against screenshots within ADR 0003's accepted approximation; this styling refinement does not change the architecture.

### Decision 0005: DesignPass.dev spring components and styling coexistence

- **Context**: The user requested integration of 5 DesignPass components (`IsometricButton`, `LiquidGlass`, `SpringSelect`, `SpringSlider`, `SpringAccordion`) plus dependency `Magnet`.
- **Decision**: Adopt a modular folder structure (`src/components/ui/<category>/<Component>/` and `src/components/effects/<Component>/`). Support Tailwind CSS utilities without interfering with existing CSS Modules (`*.module.css`) and global design tokens (`--color-*`). Install `html2canvas-pro` for WebGL texture fallback in Safari/Firefox. Configure `components.json` for shadcn registry interoperability.
