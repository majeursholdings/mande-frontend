# Project Rules

- **Avoid `useEffect`**: Always prefer event-driven state updates (e.g. event handlers, `onValueChange` callbacks, derived state, or form control callbacks) instead of `useEffect`.
- **Forms**: Always use `react-hook-form` (with `zod` and `@hookform/resolvers/zod` for schemas and validation).
- **HTTP / Networking**: Always use `axios` for all API calls and network requests.
- **Dates & Times**: Always use `dayjs` for all date/time manipulation, formatting, and calculations.
- **Animations & Transitions**: Always use `motion` (from `'motion/react'`) for all UI animations, micro-interactions, and transitions.
- **Notifications / Toasts**: Always use `sonner` (`toast.success`, `toast.error`, `toast.info`, etc.) for notifications and feedback.
- **Icons**: Always use `lucide-react` for all UI icons.
- **Debouncing**: Always use `use-debounce` (e.g., `useDebounce`, `useDebouncedCallback`) for debounced search, filters, and rate-limited inputs.

---

# File Upload Rules

Uploads MUST go through:

- backend endpoints
- signed URLs
- upload services

NOT direct filesystem mutations from frontend.

---

# Security Rules

Agents MUST NOT:

- expose secrets
- hardcode API keys
- access env variables in client components unless public
- generate insecure auth flows
- bypass validation

---

# Networking Rules

Agents SHOULD:

- use `axios` for all HTTP requests
- configure standard interceptors and base clients
- use request timeout handling
- handle API errors properly
- normalize API responses
- avoid duplicate requests

---

# Code Quality Rules

Agents SHOULD generate:

- clean code
- strongly typed code (TypeScript)
- reusable abstractions
- scalable architecture
- maintainable folder structures

Agents SHOULD avoid:

- massive components
- deeply nested logic
- duplicated API calls
- business logic inside UI

---

# Performance Rules

Agents SHOULD prefer:

- debounced inputs/search with `use-debounce`
- lazy loading
- memoization
- virtualization for large lists
- efficient renders
- pagination