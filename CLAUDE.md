@AGENTS.md

# Project conventions

- Forms for the manufacturer platform live in `components/manufacturerPlatform/form/` — put every new manufacturer-platform form file there (not in the page folder that uses it) and import it via `@/components/manufacturerPlatform/form/...`.
- All table UI — any list of rows under column headers, on every platform — is built with `DataTable` and the helpers exported from `@/components/customTable` (`components/customTable/index.tsx`): `ColumnDef` for columns, its built-in pagination, `showIndex`, row actions, `TableToolbar`/`SearchInput`/`SelectFilter`, `useTableRows`, `StatusBadge`. Don't hand-roll `<table>` markup, use `components/ui/table` directly, or write a per-page pagination component. If `DataTable` is missing something a table needs, add it as an optional prop in `components/customTable/` so every table gets it.
- Every form submit handler wraps its work in `try`/`catch` (plus `finally` to reset loading state when there is one) and shows a user-facing `toast.error(...)` in the `catch`, so failures are handled on the frontend instead of throwing silently. See `components/manufacturerPlatform/loginPage/index.tsx` for the pattern.
