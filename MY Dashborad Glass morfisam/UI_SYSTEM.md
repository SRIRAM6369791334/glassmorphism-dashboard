# Design system

2026-10-09: the existing visual system remains the reference. Real auth feedback, an email login label, password guidance and a signed-in/logout view now connect APIs. Static/error/loading deferrals below are historical; no redesign was authorized.

Purpose: translate reference evidence into reusable design decisions before components are built. Values below describe the delivered implementation; they are not claims of exact source tokens. CSS custom properties live in src/styles/global.css.

## Colors

| Role | Token value | Usage |
| --- | --- | --- |
| Primary | #f5f5f6 | Main text and emphasis |
| Secondary | #d5d5d8 | Supporting controls |
| Background | #08090b | Page behind wallpaper |
| Surface | rgba(35, 35, 39, 0.45) | Dark glass card |
| Welcome surface | rgba(96, 96, 103, 0.18) | Lighter panel overlay |
| Text | #f5f5f6 | Headings and labels |
| Muted text | #c3c3c9 | Supporting copy |
| Border | rgba(235, 235, 241, 0.27) | Shell, buttons, divider |
| Error | #ffb4ab | Reserved for future error feedback |
| Success | #b8dfbd | Reserved for future success feedback |
| Warning | #f2d18d | Reserved for future warning feedback |

Use a dark charcoal fallback when backdrop filters are unavailable. Reserve semantic colors without adding unrequested feedback designs.

## Typography and spacing

Arial, sans-serif is the approved approximation; the exact original font is unknown. Form titles start at 28 px/1.2, bold. Welcome headings start at 38 px/1.02, bold, uppercase. Body and controls start at 14 px/1.4, with supporting captions smaller only when still readable. Keep letter spacing restrained and tune comparison against the reference.

Use a 4, 8, 12, 16, 24, 32, 40, 48, 64 px spacing scale. Desktop form width is approximately 300 px. Related field spacing should be consistent rather than copied independently.

## Surfaces and components

- **Container/card:** centered, approximately 900 × 530 px at desktop size; 24 px radius, fine outline, dark translucent fill, 28 px blur, soft deep shadow. A clipped, overscanned layer reuses the same SVG with CSS filter blur so the frosted effect is consistent where native backdrop rendering is incomplete. Native backdrop-filter remains enabled, with an opaque charcoal fallback when unsupported.
- **Divider:** diagonal from approximately 47% at the top to 53.5% at the bottom, with a subtle thin edge. Welcome panel is lighter.
- **Input:** transparent underlined row, outline icon, accessible name, muted placeholder, and visible focus. Mobile text is at least 16 px.
- **Password input:** shared field plus a keyboard-accessible visibility button and state-dependent accessible name.
- **Button:** pill outline and subtle translucent fill; desktop primary height approximately 44 px. Hover brightens fill and border with no lift.
- **Form:** shared column structure and spacing. Login fields use account identity and password; registration uses full name, work email, and password.
- **Link:** inline account switch and recovery actions styled as restrained text controls with visible focus.
- **Header:** only the form and welcome headings; no application navigation header is present.
- **Logo:** none supplied inside the intended UI. Exclude the recording's orange V2 mark.
- **Error/loading:** future conventions only; do not invent backend error or loading states in the static delivery.
- **Notice:** unobtrusive neutral live feedback that explains the preview boundary without implying authentication success.

## Motion and responsive behavior

Use approximately 200 ms outgoing fade/outward movement and 400 ms incoming movement. Keep wallpaper and shell stationary. Mobile uses a short fade; reduced motion removes spatial movement. Below 768 px, stack active form above compact welcome content with natural vertical scrolling. See [responsive guidance](RESPONSIVE_GUIDELINES.md) and [reference analysis](docs/ui/reference-analysis.md).
