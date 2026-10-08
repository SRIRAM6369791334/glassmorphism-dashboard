# Security boundaries

Purpose: state the current data boundary and the requirements that future authentication work must address.

## Current static delivery

Form values exist only in transient UI memory. Submit and recovery actions display a neutral preview notice. Do not send credentials, store them in localStorage/sessionStorage/cookies, log them, add analytics that captures them, or claim a successful login or created account.

Use local assets and inline icons. Do not include API keys or environment secrets in the repository. Password visibility is an explicit user action; hiding an input is presentation, not encryption.

Browser autofill is controlled by the browser and user. Application storage behavior must be assessed independently from browser password-manager behavior.

## Future integration

A later authentication feature must define backend validation, password transport and processing, session/token handling, request protection, error handling, logout, recovery, and protected navigation. Do not choose storage or session policy without a real backend contract. Database changes require explicit authorization.

Check future dependencies and third-party scripts before introducing them, and avoid capturing sensitive form data in diagnostics. Review this document when the application starts handling actual accounts or network authentication.
