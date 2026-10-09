# AI-assisted development

Purpose: explain how agents use project memory and collaborate over time.

Begin at [AGENTS.md](AGENTS.md). Treat the latest user request as task scope, existing code as implementation truth, reference assets as design evidence, and documentation as durable project context. Resolve contradictions by inspection and record meaningful corrections.

Use [AI_RULES.md](AI_RULES.md) for agent conduct, [PROCESS.md](PROCESS.md) for mandatory stages, and [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) for commands. [AI_CONTEXT.md](AI_CONTEXT.md) is the concise handoff snapshot; it should not duplicate every specification.

## Task shaping

Use the five [prompt templates](PROMPTS/) for features, bug fixes, UI implementation, refactoring, and testing. Replace placeholders with concrete outcomes and constraints. Include acceptance criteria and relevant references before implementation.

For parallel work, assign non-overlapping ownership and communicate interface assumptions. Integrate and verify shared behavior before marking tasks complete.

## Durable memory

Record dated decisions with alternatives and tradeoffs. Add verified technical discoveries to LEARNINGS and real failure analyses to LESSONS_LEARNED. Update context, changelog, tasks, and affected guides after meaningful changes.

Do not copy speculative findings into the verified-state snapshot. Preserve failed checks and limitations in the handoff. Documentation is complete when another engineer can continue without reconstructing the conversation.
