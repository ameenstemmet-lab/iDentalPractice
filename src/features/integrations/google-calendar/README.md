# Google Calendar Integration

Syncs Supabase appointments to a connected Google Calendar. **Supabase is
always the source of truth** — this module only ever pushes Supabase's
state *to* Google; nothing ever reads Google Calendar back into
`appointments`.

## Architecture

```
types/         CalendarProvider interface (provider-agnostic) + domain types
utils/         token encryption (AES-256-GCM), OAuth state signing (HMAC),
               exponential backoff, event ownership tagging
api/           thin Google REST clients — oauth-client.ts, calendar-api-client.ts.
               No orchestration, no storage, injectable fetch for tests.
repository/    the only layer that touches Supabase — GoogleCalendarRepository
               (connections/tokens/sync queue) + AppointmentSyncDataSource
               (the narrow read/write this module does against `appointments`)
services/      OAuthService, TokenRefreshService, GoogleCalendarService,
               CalendarSyncService, ConflictDetectionService, SyncQueueService
actions/       Next.js Server Actions the settings UI calls (disconnect,
               select calendar, test connection, ...)
hooks/         useGoogleCalendarConnection — client-side wrapper over the actions
components/    ConnectionStatusCard, ConnectCalendarButton, CalendarSelector,
               SyncStatusBadge — built from the existing design system
testing/       in-memory repository + datasource fakes, FakeCalendarProvider
```

Route handlers for the two steps of the OAuth redirect flow (which must be
plain HTTP endpoints, not Server Actions, since Google redirects the
browser to them) live at `src/app/api/integrations/google-calendar/oauth/`.
The settings page is `src/app/(dashboard)/settings/integrations/google-calendar/page.tsx`.

## Why `CalendarProvider` is the seam

`GoogleCalendarService` implements `CalendarProvider` (`listCalendars`,
`createEvent`, `updateEvent`, `cancelEvent`, `listEvents`).
`CalendarSyncService` and `ConflictDetectionService` depend on that
interface, never on Google's SDK or REST shape. An Outlook or Apple
Calendar integration is a new class implementing the same interface,
wired into the same connection/sync-queue tables (with a `provider`
column already in place for exactly this) — zero changes to sync
orchestration, retry logic, or conflict detection. An AI receptionist
asking "is this practitioner free, including their personal calendar?" calls
`ConflictDetectionService.findExternalConflicts()` — the same call a human
settings page makes.

## OAuth flow

1. `GET /api/integrations/google-calendar/oauth/start?practiceId=...` builds
   a Google consent URL with a signed `state` parameter (HMAC, 10-minute
   expiry — see `utils/oauth-state.ts`) encoding which practice/practitioner
   initiated the connection, and redirects the browser to it.
2. Google redirects back to
   `GET /api/integrations/google-calendar/oauth/callback?code=...&state=...`.
   The state is verified before anything else happens — this is the CSRF
   protection for the whole flow. The code is exchanged for tokens
   server-side (client secret never leaves the server), the account email
   and calendar list are fetched, and the connection + encrypted tokens
   are persisted.
3. Every subsequent Google API call goes through `TokenRefreshService`,
   which transparently refreshes the access token when it's within 2
   minutes of expiry, and marks the connection `status: 'error'` if the
   refresh token itself has been revoked (distinct from a transient
   failure — this stops the retry queue from hammering a dead credential
   forever).

## Token storage

Two tables, deliberately split:

- `google_calendar_connections` — practice-visible metadata (email,
  calendar name, status, last synced). RLS lets practice members read and
  manage it.
- `google_calendar_tokens` — encrypted access/refresh tokens. **No RLS
  policy grants any client role access at all** — only the service role
  (used exclusively by this module's server-side code) can read or write
  it. Tokens are additionally encrypted at the application layer
  (AES-256-GCM, `utils/token-encryption.ts`) before being stored, so a
  service-role key leak or a future policy mistake still wouldn't expose
  usable credentials.

## Sync

`CalendarSyncService.onAppointmentCreated/Updated/Cancelled(appointmentId)`
— call each right after the corresponding write to `appointments`
succeeds. Every call:

1. Looks up the practitioner's own connection, falling back to the practice-wide
   one.
2. Enqueues a durable job in `calendar_sync_queue` (a database-level unique
   index prevents a duplicate pending/processing job for the same
   appointment+operation — "duplicate synchronization attempts" is
   prevented structurally, not just in application logic).
3. Makes one best-effort inline attempt so the UI reflects sync quickly.

A failure on that inline attempt is **not** surfaced to the caller as an
error — the appointment write already succeeded and must not be rolled
back over a Google hiccup. The job stays `pending` for the retry sweep
(`CalendarSyncService.processPendingJobs()`), which retries with
exponential backoff (`utils/backoff.ts`, capped at 1 hour, giving up after
8 attempts) and never throws past its own bookkeeping.

**Deployment note**: nothing in this repository calls
`processPendingJobs()` on a schedule — that requires a periodic trigger
(Supabase `pg_cron`, or an external scheduler hitting a small route that
calls it) that isn't part of this module's code. Without one, only the
inline best-effort attempt runs; genuinely failed syncs will sit `pending`
until something calls the sweep.

### Self-healing edge cases

- **Event deleted on Google's side, then we try to update it**: a 404 is
  caught and treated as "recreate," not "fail forever."
- **Event deleted on Google's side, then we try to cancel it**: a 404 is
  treated as success — the goal ("this isn't active") is already true.
- **Calendar itself deleted or access revoked**: surfaces as a
  `TokenRevokedError` or a persistent API error; the connection is marked
  `status: 'error'` so the admin UI shows it needs reconnecting, rather
  than retrying silently forever.

## Conflict detection

`ConflictDetectionService.findExternalConflicts(practiceId, practitionerId, range)`
checks the connected calendar for events **we didn't create** overlapping
a proposed range — a practitioner's personal doctor's appointment, school
pickup, anything on their calendar this system doesn't know about. Our own
synced events are tagged via `extendedProperties.private` (see
`utils/event-tag.ts`) and always excluded, so an appointment never
"conflicts" with its own calendar event. This is a standalone capability —
deliberately not wired into `features/scheduling`, which this integration
must not modify. A future orchestration layer can call both and combine
the results.

## `PATCH`, not `PUT`

`GoogleCalendarApiClient.updateEvent` uses `PATCH`. A `PUT` replaces the
entire event resource — without re-sending `extendedProperties` on every
update, a `PUT` would silently strip the ownership tag the first time an
appointment's time changed, and the next conflict scan would treat our
own event as external. `PATCH` only touches the fields provided, so the
tag set at creation time survives every subsequent update for free. See
the regression test in `api/calendar-api-client.test.ts`.

## Environment variables

See `.env.local.example`. `GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY` must be a
base64-encoded 32-byte key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Known gap: no auth yet

Every connect/disconnect/select-calendar entry point takes a `practiceId`
(or a `connectionId` that already belongs to one) as a plain argument —
there is no session to derive it from, because authentication doesn't
exist yet in this codebase. Each server action and route handler has a
`// TODO(auth):` comment marking exactly where an authorization check
(caller is a member of this practice, with permission to manage
integrations) must be added once login exists. The settings page
similarly resolves "the current practice" via the first row in
`practices` — correct for a single-practice deployment, explicitly not for
real multi-tenant use.

## Testing

```bash
npm test -- src/features/integrations/google-calendar
```

62 tests: pure unit tests for every util and API client (using an
injectable `fetch`, no real network), and service-level tests against
`InMemoryGoogleCalendarRepository` / `InMemoryAppointmentSyncDataSource` /
`FakeCalendarProvider` — no mocking framework, no database, no Google API
calls. Covers OAuth (URL construction, state CSRF protection, code
exchange, account/calendar resolution, reconnect-updates-not-duplicates),
token refresh (cached vs. refreshed vs. revoked), calendar CRUD (including
the PATCH-not-PUT regression), sync orchestration (create/update/cancel,
self-healing on 404, connection-not-found no-ops, dedup), conflict
detection (external vs. own-event exclusion, cancelled events, practice-wide
fallback), and queue retry (backoff progression, max-attempts failure,
due-job filtering).
