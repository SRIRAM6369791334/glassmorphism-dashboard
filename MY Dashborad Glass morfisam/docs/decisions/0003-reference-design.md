# ADR 0003 — Reference fidelity and responsive adaptation

## Context

The references show desktop composition and motion but do not supply the exact wallpaper, font, or mobile behavior.

## Options considered

- Reproduce the entire recording: would incorrectly include presentation/browser chrome.
- Substitute a generic authentication layout: would violate the visual brief.
- Preserve the intended UI composition, scale it for desktop use, recreate assets locally, and document approved adaptations.

## Selected approach

Use the screenshots for settled geometry and recording for motion. Target a 900 × 530 px desktop card and a diagonal boundary at 47% top / 53.5% bottom. Recreate the black geometric wallpaper in SVG and use Arial. Below 768 px stack the active form above compact welcome content. Approximate transitions with 200 ms exit plus 400 ms enter, reducing movement for accessibility.

## Reason

This preserves the defining visual relationships while producing a usable page from incomplete source assets.

## Trade-offs

Wallpaper pixels and exact font metrics differ from the source. Mobile is an approved adaptation, not observed behavior. Absolute timing and easing remain approximations based on sampled frames.

## Date

2026-10-08. Status: accepted.

## Implementation refinement — 2026-10-08

The first screenshot revealed insufficient tonal variation beneath the frosted card. Interior wallpaper facets were added, with 45% surface opacity and 28 px blur. Cross-engine screenshot review then found incomplete native backdrop rendering in Windows headless Firefox/WebKit despite CSS support detection. A clipped CSS-filtered wallpaper layer reuses the same SVG to provide consistent frost; native backdrop-filter and the opaque unsupported-feature fallback remain. This is a rendering refinement within the accepted asset approach, with no new dependency or API.
