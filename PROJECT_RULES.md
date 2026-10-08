# Project rules

Purpose: maintain repository-wide architecture, code, and design conventions.

- Use TypeScript with strict checking. Prefer explicit props and typed form values over unchecked casts.
- Use PascalCase for React components and matching component module filenames; use camelCase for functions and variables. Keep CSS Module classes descriptive.
- Organize by application composition, feature, reusable UI, styles, and assets. Keep feature rules out of generic visual components.
- Reuse the shared input, password input, button, card, and form layout before adding another version. Do not duplicate Login/Register visual infrastructure.
- Keep visual constants in tokens where reused. Scope component selectors with CSS Modules.
- The screenshots and recording are the visual source of truth; approved desktop scaling, Arial fallback, recreated wallpaper, and mobile stacking are documented adaptations.
- Default to semantic HTML. Add ARIA only to supply missing semantics or state.
- Keep assets local and optimized. Use inline SVG for simple interface icons.
- Explain the purpose of each new dependency before installation; prefer existing platform and framework capabilities.
- Preserve features unless the user authorizes removal. Database structure changes require approval; this delivery has no database.
- Do not add credential storage, network submission, fake login success, protected routes, or unrequested dashboard functionality.
- Keep secrets, node_modules, build output, test reports, and generated browser artifacts out of version control.
- Keep the lockfile. Update affected documentation and run appropriate checks before claiming completion.

Commands belong in [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md); mandatory stages belong in [PROCESS.md](PROCESS.md).
