@AGENTS.md

# Project conventions

- Forms for the manufacturer platform live in `components/manufacturerPlatform/form/` — put every new manufacturer-platform form file there (not in the page folder that uses it) and import it via `@/components/manufacturerPlatform/form/...`.
- Every form submit handler wraps its work in `try`/`catch` (plus `finally` to reset loading state when there is one) and shows a user-facing `toast.error(...)` in the `catch`, so failures are handled on the frontend instead of throwing silently. See `components/manufacturerPlatform/loginPage/index.tsx` for the pattern.
