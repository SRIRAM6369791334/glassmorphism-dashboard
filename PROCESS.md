# Mandatory development process

Purpose: define the stages every feature follows. Scale effort to the change while preserving the sequence.

| Stage | Required outcome |
| --- | --- |
| Requirement | State user outcome, scope, constraints, and completion criteria. |
| Reference analysis | Inspect supplied visuals or existing behavior; distinguish measurements from assumptions. |
| Architecture decision | Reuse existing boundaries or record a dated decision with alternatives and tradeoffs. |
| Implementation plan | Identify affected behavior, integration points, and verification. |
| Component design | Define reusable parts, state ownership, interfaces, and accessibility. |
| Implementation | Make the authorized change using repository conventions. |
| Self review | Inspect code and behavior for correctness, duplication, and scope. |
| Testing | Run appropriate type, lint, build, and behavior checks. |
| Visual validation | Compare relevant states, motion, and responsive layouts. |
| Bug fix | Resolve observed failures; repeat affected checks. If no findings, record that fact. |
| Documentation update | Update current context, changelog, task status, and relevant guidance. |
| Final verification | Confirm delivered behavior and truthful test evidence, then provide a concise handoff. |

## Initial delivery record — 2026-10-08

Requirements, reference analysis, architecture decisions, the implementation plan, and component design were documented before application code. The approved plan is recorded in [implementation-plan](docs/architecture/implementation-plan.md). The application is implemented and self-reviewed; initial static checks passed. Desktop/mobile screenshot review identified flat-looking glass over uniform wallpaper facets, prompting a targeted wallpaper/surface refinement. Full browser testing, final refinement checks, and the final documentation handoff are in progress. Actual results are tracked in [verification](docs/ui/verification.md).

A stage is complete only when its outcome is observed. Do not label the project tested merely because a test plan exists. Ongoing documentation is a completion requirement for every feature.
