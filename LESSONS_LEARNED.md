# Lessons learned

Purpose: record actual mistakes or failed approaches, root causes, solutions, and prevention. Technical discoveries belong in [LEARNINGS.md](LEARNINGS.md).

## 2026-10-08 — Initial glass appeared too flat

**Issue:** The first desktop screenshot lacked the cloudy tonal variation visible in the source card.

**Root cause:** Large, uniform central wallpaper faces sat directly beneath the card. The opaque dark surface further subdued their limited variation.

**Solution:** Add varied interior facets and local tonal transitions to the wallpaper. Refine surface opacity to 45% and blur to 28 px together. The final screenshots show the intended cloudy variation.

**Prevention:** Review the wallpaper through the actual card crop early. Judge background geometry, translucency, and blur as one composition, then recheck contrast and multiple browsers.

## 2026-10-08 — Passing interaction checks missed missing frost

**Issue:** The initial 42 browser tests passed, but manual Firefox/WebKit screenshot review showed sharp background facets through the card.

**Root cause:** In the Windows headless rendering environment, native backdrop-filter support/computed style did not guarantee the expected rendered blur. Isolation/translateZ trials did not resolve the discrepancy.

**Solution:** Add a noninteractive, overscanned wallpaper layer clipped within the card, using the same SVG, dark tint, and 28 px CSS filter blur. Keep native backdrop-filter and the opaque unsupported-feature fallback. Final desktop images were inspected in Chromium, Firefox, and WebKit and show frost.

**Prevention:** Validate visual effects through cross-engine screenshots as well as interactions and CSS feature queries. Rerun affected checks after the rendering fix.
