# Testing task template

Verify [feature/change] against [requirements and reference paths].

Read AGENTS, TESTING, the feature specification, and relevant implementation. Identify user-visible failure modes instead of mirroring implementation details.

Check [behavior], [browser engines], [viewport sizes], and [accessibility/data boundaries]. For this authentication preview, verify no credential transport or persistence, honest notices, hidden-view exclusion, focus transfer, password visibility, and stable switching.

Run the existing relevant checks first. Add only meaningful missing coverage. Inspect visual output rather than treating generated screenshots as approved baselines.

Report each actual command and result, failures with reproduction evidence, unavailable checks, and remaining limitations. Update verification records and current task status accurately; never label an unrun check successful.
