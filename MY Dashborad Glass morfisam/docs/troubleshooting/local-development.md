# Local development troubleshooting

Purpose: provide targeted diagnosis without claiming unobserved application failures.

## Installation and runtime

If Vite rejects the Node version, compare the installed package's engine requirement with `node --version`; Node 22.20.0 is the observed project baseline. Do not change the stack to mask a local version mismatch.

If dependencies are missing, use `npm ci` when the lockfile exists. Preserve the lockfile when resolving an installation problem. First-time browser setup uses `npx playwright install` and may need network access.

## Browser tests

A missing browser executable means the engine is not installed, not that the application test passed. Install the required engines or record that coverage is unavailable. Check the Playwright web-server URL and port before diagnosing navigation timeouts as UI defects.

Keep test reports and screenshots as local artifacts. Inspect failures before changing expectations or approving screenshot baselines.

## Visual differences

Compare only the intended UI crop. Verify the viewport, loaded local wallpaper, active view, finished animation, and font fallback. Original wallpaper and font are unavailable, so differentiate accepted asset approximation from fixable geometry or styling issues.

If blur is unavailable, the charcoal fallback should remain readable. If mobile content is clipped, inspect fixed heights and overflow rules; the approved mobile behavior allows vertical scrolling.

## Authentication expectations

The current screen is a preview. Login, Sign Up, and recovery show an unconnected-service notice by design. No backend request should occur. Do not “fix” the preview by adding real authentication outside a separately authorized feature.

## Native blur is reported but visually missing

During initial Windows headless checks, Firefox/WebKit reported backdrop-filter support and a computed blur but rendered sharp background content. Passing interaction tests did not catch that visual difference. The implemented frostedBackdrop layer applies a 28 px CSS filter to an overscanned copy of the existing SVG inside the clipped card. Preserve this layer when tuning glass styles, and review rendered screenshots across engines rather than relying only on CSS.supports or computed styles.
