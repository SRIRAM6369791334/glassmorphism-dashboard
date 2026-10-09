# ADR 0004 — Documentation as project memory

## Context

The project will be maintained through long-term AI-assisted development. The user requires a complete engineering framework before feature code.

## Options considered

- One README: easy to start, but mixes constraints, current state, history, and process.
- A large unstructured documentation set: complete in volume but hard to navigate.
- Distinct canonical documents with an agent entrypoint and focused category records.

## Selected approach

Create all requested root documents and five prompt templates, plus substantive architecture, feature, UI, decision, and troubleshooting records. AGENTS defines read order. PROCESS governs stages; DEVELOPMENT_WORKFLOW holds commands; PROJECT_RULES governs code; AI_RULES governs agent conduct; AI_CONTEXT is the current snapshot.

## Reason

Separate responsibilities reduce contradictory guidance and let the next engineer recover context quickly.

## Trade-offs

Documentation needs ongoing maintenance. Every feature includes a documentation update stage. Avoid duplicating detailed specifications inside the context snapshot and avoid invented lessons or verification claims.

## Date

2026-10-08. Status: accepted.
