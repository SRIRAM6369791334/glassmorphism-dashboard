# Accessibility

Purpose: define usable semantics and interactions for the static authentication experience.

- Use a main landmark, meaningful form headings, semantic forms, associated field labels, and actual buttons for actions.
- Preserve visible focus on fields, links, primary buttons, welcome actions, and password toggles. Do not remove outlines without an equivalent indicator.
- Only the active form can be reached by keyboard or assistive technology. Switching transfers focus to a focusable heading; avoid input autofocus.
- Password toggles announce whether they show or hide the password and remain keyboard operable.
- Announce pending/error/confirmed results through a polite live region. Advance OTP/reset only after server confirmation. Use modal focus containment and focus return; generic notices must not reveal account existence.
- Honor `prefers-reduced-motion` by removing movement. Ensure interaction remains available when animation is reduced.
- Use sufficient text and control contrast over variable wallpaper; supply a readable charcoal fallback if backdrop blur is unavailable.
- On phones, retain at least 16 px input text and practical touch targets; allow natural vertical scrolling and zoom.
- Decorative wallpaper and icons should not add redundant screen-reader content. Icons that are the sole control content need an accessible name.
- Use appropriate autocomplete and input semantics without persisting credentials in application storage.

Verification includes keyboard navigation in both states, heading focus after switching, hidden-form exclusion, feedback announcements, reduced motion, responsive readability, and browser rendering. Automated tests assist but do not establish full assistive-technology conformance.
