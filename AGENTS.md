# Agent entrypoint

This repository is the start of a long-term, AI-assisted frontend project. The current delivery is a static reference-matched Login/Register experience. This file applies throughout the repository.

## Read before changing code

1. Read [AI_CONTEXT.md](AI_CONTEXT.md) for current truth, then [PROJECT_RULES.md](PROJECT_RULES.md) and [AI_RULES.md](AI_RULES.md) for constraints.
2. Follow [PROCESS.md](PROCESS.md). Use [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) for commands and [ARCHITECTURE.md](ARCHITECTURE.md) for boundaries.
3. For UI changes, read [UI_SYSTEM.md](UI_SYSTEM.md), [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md), [RESPONSIVE_GUIDELINES.md](RESPONSIVE_GUIDELINES.md), [ACCESSIBILITY.md](ACCESSIBILITY.md), and [reference-analysis](docs/ui/reference-analysis.md).
4. Read relevant [decisions](DECISIONS.md), [learnings](LEARNINGS.md), [lessons](LESSONS_LEARNED.md), feature docs, and tests.

## Working agreement

Complete the user's authorized work without adding approval gates for routine edits. Preserve working behavior, reuse shared components, and keep business logic outside visual primitives. Explain dependency and architectural changes before making them. The current scope has no backend, database, credential persistence, real recovery flow, or deployment.

Use the required sequence: requirement → reference analysis → architecture decision → implementation plan → component design → implementation → self review → testing → visual validation → bug fix → documentation update → final verification.

## Completion checklist

- Relevant type, lint, build, and browser checks pass; report limitations honestly.
- Visual states and responsive layouts are reviewed against the references.
- Keyboard access, focus, reduced motion, feedback, and sensitive-data behavior are checked.
- Update AI context, changelog, task status, and affected docs; record new decisions and genuine discoveries or mistakes.
- Summarize what changed, why, how it was verified, and what remains.

Use the templates in [PROMPTS](PROMPTS/) to give future agents bounded tasks. Documentation is project memory, not evidence that a check has run.
