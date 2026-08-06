# Reception & Practice Administration Portal

The staff-facing dashboard — receptionists, office managers, practice
owners. Everything under `src/app/(dashboard)/`.

## Architecture

```
features/reception/<domain>/
├── types.ts       domain types
├── actions.ts      "use server" functions — the only place Supabase is touched
└── queries.ts       "use client" React Query hooks wrapping the actions
```

Deliberately **not** the ports-and-adapters shape used by
`features/scheduling` and `features/integrations/google-calendar`. Those
carry real algorithmic complexity (conflict detection, OAuth, retries)
that needs isolation from Postgres to be testable. This portal is
CRUD-and-display over tables that already exist — a repository-interface
layer here would be abstraction for its own sake. React Query owns server
state (cache, invalidation, optimistic updates); Zustand
(`shared/ui-store.ts`) owns only client-only UI state (sidebar collapsed,
calendar view) — never a duplicate cache of server data.

Cross-domain UI (`AppointmentTable`, `PatientCard`, `StatCard`,
`ConfirmDialog`, ...) lives in `src/components/reception/`, built from the
existing design system.

## No auth yet

Every action takes/resolves `practiceId` explicitly rather than deriving
it from a session — `shared/practice-context.ts`'s `getCurrentPractice()`
resolves the *first* row in `practices`, correct for a single-practice
deployment only. `shared/supabase-admin.ts` uses the service-role key for
every read and write, since there's no session to build an RLS-scoped
client from yet. Both are marked `TODO(auth)`; RLS is already written (see
`supabase/migrations/`) and becomes the actual enforcement layer the
moment a real client-scoped Supabase client replaces the admin one — no
query needs to change, since every one already filters by `practiceId`.

## Scope notes

- **Calendar** (`app/(dashboard)/calendar/`): Day/Week/Month/Agenda are
  fully functional. Drag-and-drop rescheduling is a labeled placeholder —
  real drag-and-drop needs to re-run `BookingRulesService.validateBooking`
  from `features/scheduling` before committing a move, which is more than
  this milestone's UI scope.
- **Reports**: placeholders only, per the milestone's explicit scope.
- **Reschedule conflict prevention** leans on the database EXCLUDE
  constraint (`appointments_no_overlap`, see `supabase/migrations/`)
  rather than re-implementing scheduling validation here — the error is
  caught and translated to a friendly message in
  `appointments/actions.ts`.
- **Google Calendar sync** is triggered from appointment status/reschedule
  actions via a dynamic import of
  `features/integrations/google-calendar` (never a static import — if
  Google isn't configured, the sync call fails gracefully and is
  swallowed with a console warning, not a broken appointment update).

## Testing

`features/reception/shared/ui-store.test.ts` covers the Zustand store.
Component tests (`src/components/reception/*.test.tsx`) use
`@testing-library/react` under a per-file `jsdom` environment pragma —
the project's default Vitest environment stays `node` for the fast pure-
logic suites elsewhere. `vitest.config.ts` needed `@vitejs/plugin-react`
added (JSX wasn't parsing without it) and `vitest.setup.ts` needed an
explicit `afterEach(cleanup)` (RTL's automatic cleanup doesn't register
without Vitest's `globals: true`, which this project doesn't set).
