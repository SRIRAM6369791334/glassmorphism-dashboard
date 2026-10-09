# ADR 0006 — Downside 3D projection and tactile styling for action buttons and form inputs

- **Status**: Accepted
- **Date**: 2026-10-08
- **Deciders**: User, AI Assistant

## Context

Following the initial integration of `IsometricButton` across the authentication screen (`Login`, `Sign Up`, `Create Account`, `Sign in`), the user observed that the 3D button appeared to tilt backwards into the page, directing its 3D depth and hinge rotation towards the top/upside (`"that button up side la 3D aa irukthu"`). Concurrently, the form input fields (`Username`, `Password`, `Full Name`, `Work Email`) had been transformed into 3D glass prisms with extruded bottom bevels and purple underglow.

The user explicitly requested that the buttons project their 3D depth towards the **downside** (`"enaku downside la 3D aa vanum"`), matching the tactile orientation of physical buttons and the surrounding input prisms, while preserving the color palette (`#a855f7` neon purple on dark frosted glass).

## Options Considered

1. **Pure CSS Box-Shadow Simulation**:
   - Replace `IsometricButton` with a standard `<button>` styled with layered 3D shadows similar to `Fields.module.css`.
   - *Tradeoff*: Loses the multi-layer spring bounce animation, dynamic floor reflection, and DesignPass.dev isometric component architecture.

2. **Reverse Inversion (`rotateX: -25deg`)**:
   - Apply a negative X rotation angle directly.
   - *Tradeoff*: In orthographic projection, negative X rotation pushes the top face downward, exposing the top rear edge and flipping the floor reflection upwards above the button.

3. **Downside 3D Camera Realignment & Edge Shading (Selected)**:
   - Eliminate the default backward hinge lift (`standAngle: 0deg`).
   - Configure a forward perspective tilt (`rotateX: 30deg`, `rotateZ: 0deg`).
   - Increase prism extrusion depth (`thickness: 18px`, `gapRest: 12px`).
   - Extend the `IsometricButton` API with `edgeColor` (`#261c36`) and style `.iso-btn-side` with downward slice shadows (`0 1px 0 rgba(0,0,0,0.45)`) and `.iso-btn-top` with a bottom bevel (`inset 0 -2px 0 rgba(0,0,0,0.45)`).

## Decision

Adopt Option 3:
1. Re-align `IsometricButton` geometry to eliminate the backward stand angle and face the camera with a natural downward extrusion.
2. Enrich the 3D side layers with contrasting violet-charcoal edge colors and directional slice shadows so the bottom thickness is crisp and prominent against the dark frosted card.
3. Keep all form submission handlers, password visibility toggles, keyboard accessibility, and reduced-motion fallbacks untouched.

## Consequences

- Action buttons now have prominent tactile 3D depth visible on the bottom edge (downside).
- Visual harmony between the 3D input fields and action buttons is achieved.
- All 14 Playwright tests pass with 100% success rate on Chromium.
