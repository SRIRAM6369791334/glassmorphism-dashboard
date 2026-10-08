# Performance

Purpose: keep the visual implementation lightweight and preserve measured evidence.

The implementation uses one local SVG wallpaper, inline SVG icons, CSS motion, and React local state. No animation, icon, routing, global-state, form, or HTTP library is installed.

The stationary card contains an overscanned, clipped copy of the same SVG with CSS filter blur to provide consistent frost across engines. This reuses the asset without an additional download; native backdrop-filter remains enabled where supported. Only content and the welcome/divider layer animate during switching.

Avoid layout measurements on every animation frame and do not introduce memoization without a measured problem. The transition hook clears its timer on teardown.

## Production build — 2026-10-08

| Output | Raw | Gzip |
| --- | --- | --- |
| HTML | 0.53 kB | 0.32 kB |
| JavaScript | 226.44 kB | 71.03 kB |
| CSS | 9.29 kB | 2.66 kB |
| SVG wallpaper | 11.38 kB | 3.18 kB |

These are Vite's final reported build sizes after the frost refinement. They are measurements, not a claim of a formal performance budget or real-device benchmark. See [verification](docs/ui/verification.md) for test and visual-review coverage.
