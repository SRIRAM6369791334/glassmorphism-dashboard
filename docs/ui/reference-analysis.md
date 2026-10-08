# Reference analysis

Date: 2026-10-08. Sources: the supplied Login and registration images, and “Screen Recording 2026-10-08 094331.mp4”. The recording was inspected during planning. It is approximately 6.233 seconds at 1920 × 1020.

## Directly observed

The intended demonstration region is approximately 480 × 331 px; its card is approximately 383 × 226 px. These are source-display measurements, not intended CSS pixel dimensions. Outer presentation content, browser/social chrome, an orange V2 mark, code sample, and surrounding black margins are excluded.

The wallpaper uses angular, black beveled blocks with occasional bright silver edges. A centered, rounded charcoal glass card blurs the wallpaper. A diagonal edge divides the halves, approximately 47% from the left at the top and 53.5% at the bottom. The welcome side is lighter.

Login has the form on the left and a two-line uppercase HELLO, FRIEND! message on the right. Registration has Create Account on the right and WELCOME BACK! on the left. Inputs use fine underlines and thin outline icons. Primary and welcome actions are pill-shaped. Hover brightens button fill and outline without observed vertical lift.

## Recording timeline

| Approximate source timestamp | Observation |
| --- | --- |
| 1.13 s | Login → registration interaction begins. |
| 1.30 s | Outgoing content is nearly invisible. |
| 1.40 s | Incoming registration content becomes visible. |
| 1.80 s | Registration composition settles. |
| 2.47 s | Registration → Login interaction begins. |
| 2.60 s | Outgoing content is nearly invisible. |
| 2.675 s | Incoming Login content becomes visible. |
| 3.00 s | Login composition settles. |

The wallpaper and outer card remain stationary. For Login → registration, the lighter welcome side changes to the left as the divider enters from the right; the reverse transition enters from the left. Use roughly 200 ms exit and 400 ms entry as the approved timing approximation. Source sampling does not establish exact easing.

## Approved implementation choices

Scale the desktop card to approximately 900 × 530 px, with 300 px forms, 24 px corners, 28 px form titles, 38 px welcome headings, 14 px supporting text, and 44 px primary buttons. Use Arial with sans-serif fallbacks because the original font cannot be identified confidently.

Recreate the wallpaper as a local SVG rather than asserting an exact asset match. Use shared grayscale tokens, strong blur, subtle borders, and shadows. Below 768 px, stack form above compact welcome content and use short fade. The reference does not show a mobile layout; this is an approved adaptation.

Accessible labels, focus indicators, incoming-heading focus, reduced motion, and charcoal blur fallback are required implementation behavior. Their exact styling is not established by the supplied frames.

## Validation target

Compare both settled views at 1128 × 778 and inspect the intermediate phases. Evaluate composition and relative geometry before fine detail. Treat the unknown font and recreated wallpaper as explicit fidelity limits; do not describe the result as a pixel-identical source copy.

Preserved comparison crops: [Login](references/login.png) at source time 0.5 s and [registration](references/register.png) at 2.1 s. Both are 480 × 331 px crops (source x398–878, y400–731).
