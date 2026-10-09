# ADR 0005: DesignPass.dev modular spring components and hybrid styling coexistence

## Status
Accepted

## Date
2026-10-08

## Context
The user requested adding 5 interactive UI components from DesignPass.dev:
1. `IsometricButton` (`IsometricButton-TS-CSS.json`): Floating 3D prism button with floor glow, reflection, and spring bounce.
2. `LiquidGlass` (`LiquidGlass-TS-TW.json`): Physical optical refraction panel with Apple-style squircle bezel, jelly squish, and magnetic tracking.
3. `SpringSelect` (`SpringSelect-TS-TW.json`): Spring-opened dropdown with search, keyboard typeahead, and magnetic trigger.
4. `SpringSlider` (`SpringSlider-TS-TW.json`): Velocity squash-and-stretch channel slider with live readout.
5. `SpringAccordion` (`SpringAccordion-TS-TW.json`): Spring height integrator disclosure list.
6. `Magnet` (`Magnet-TS-TW.json`): Shared dependency for cursor magnetic hover, 3D tilt, and specular glare.

The project currently uses React 19, TypeScript, Vite, CSS Modules, and custom properties. Some components rely on pure CSS (`IsometricButton`), while others use utility classes (`-TW`). The user also specified organizing buttons and controls into dedicated subfolders (`src/components/ui/button/IsometricButton/`, etc.) rather than a flat file dump.

## Decision
1. **Directory Structure**:
   - UI controls placed under categorized subdirectories in `src/components/ui/`:
     - `button/IsometricButton/`
     - `select/SpringSelect/`
     - `slider/SpringSlider/`
     - `accordion/SpringAccordion/`
   - Visual effects placed in `src/components/effects/`:
     - `LiquidGlass/`
     - `Magnet/`
2. **Styling Strategy**:
   - Support utility classes required by DesignPass components via Tailwind CSS configuration or targeted utility mappings, while preserving pure CSS Modules for the core authentication screen.
   - Maintain DesignPass design tokens (`--dp-accent`, `--dp-control-track`, `--dp-surface-solid`, `--dp-radius-*`) in balance with existing theme tokens.
3. **Dependencies**:
   - Install `html2canvas-pro` for WebGL fallback texture capture on non-Chromium browsers.
   - Configure `components.json` for shadcn compatibility.
4. **Documentation**:
   - Provide standalone minimal usage examples for all 6 components to verify reusability without polluting the auth production route.

## Consequences
- High-quality, spring-physics UI interactions become readily available for future dashboard views.
- Auth screen remains untouched and isolated in its CSS Modules boundary.
- Zero breaking changes to the existing test suite.
