# Scheduling Engine

Determines exactly which appointments can be booked. This is the one
module every future booking surface — the current wizard, a Google
Calendar sync, Microsoft Outlook, an AI receptionist, a WhatsApp bot —
is expected to depend on, so it is deliberately free of any dependency
on how it's called.

## Architecture

```
types/        canonical types (WorkingWindow, TimeSlot, DayAvailability, ...)
utils/        time-math.ts — pure interval/timezone arithmetic (date-fns + date-fns-tz)
engine/       pure functions only — no Supabase, no React, no Date.now() side effects
  working-hours.ts     validateWorkingHours, toTimeWindow
  slot-generator.ts    generateDailySlots, generateWeeklySlots
  conflict-detector.ts overlapsAppointment, detectConflicts, isSlotAvailable
  next-available.ts    findNextAvailableSlot
repository/   the only place that knows about Supabase — an interface (SchedulingRepository)
              + one real implementation + (in testing/) one in-memory fake
services/     AvailabilityService, BookingRulesService, WorkingHoursService,
              TimeSlotGenerator, ConflictDetector — fetch via the repository,
              delegate the actual math to engine/
hooks/        useAvailability — thin client wrapper over AvailabilityService
```

**The engine has zero I/O dependencies.** Every function takes plain data
in — working windows as minutes-from-midnight, breaks, blocked intervals,
booked intervals, `now` as an explicit parameter — and returns plain data
out. A hidden `new Date()` or a Supabase import inside the algorithm would
weld the engine to one integration; every scheduling rule lives in
`engine/conflict-detector.ts`'s `detectConflicts`, called by both slot
generation (grid candidates) and booking validation (the exact interval
being booked), so the two can never disagree about what "available" means.

**`services/` depend on a repository interface, not Supabase directly.**
Production wires in `SupabaseSchedulingRepository`; tests wire in
`InMemorySchedulingRepository` — zero mocking. This is also the seam a
future integration (e.g. blocked periods sourced from a synced external
calendar) would implement against, without touching any scheduling logic.

**Timezone conversion happens at exactly one boundary.** Working hours and
breaks are recurring weekly patterns — naturally *local wall-clock time*,
no date attached (`TimeWindow`, minutes from local midnight). Appointments
and blocked periods already have a specific date — naturally *absolute
instants* (`Interval`, real `Date`s). `utils/time-math.ts` converts
local-wall-clock → absolute instant for a specific calendar day exactly
once (`windowToInterval`, via `date-fns-tz`'s `fromZonedTime`). Every other
comparison is plain instant-vs-instant. `toZonedTime` + native `Date`
getters are deliberately not used anywhere in this module — that
combination's behavior depends on the *runtime's own* system timezone,
which is exactly the bug class that shipped once already in this codebase
(the booking module's original `toISODate`, fixed in a later commit).

## The database-level backstop

Application-level conflict checks give fast, friendly errors but cannot
fully close the race window between two concurrent booking requests. See
`supabase/migrations/20260806100009_prevent_overlapping_appointments.sql`:
a Postgres `EXCLUDE` constraint (`btree_gist`) makes it structurally
impossible for two non-cancelled appointments for the same practitioner to have
overlapping time ranges, even under concurrency. The app-level check
(`BookingRulesService.validateBooking`) still runs first, for a good error
message — the constraint is what makes the guarantee actually hold.

## Using it

```ts
import { AvailabilityService, BookingRulesService } from "@/features/scheduling/services";
import { SupabaseSchedulingRepository } from "@/features/scheduling/repository";

const repository = new SupabaseSchedulingRepository(supabaseClient);
const availability = new AvailabilityService(repository);
const bookingRules = new BookingRulesService(repository);

// What can be booked today?
const day = await availability.getDayAvailability({
  practitionerId, date: "2026-08-10", timezone: "Africa/Johannesburg", durationMinutes: 30,
});

// Day is full — where's the next opening?
const next = await availability.findNextAvailable({
  practitionerId, fromDate: "2026-08-10", timezone: "Africa/Johannesburg", durationMinutes: 30,
});
// -> { date: "2026-08-11", time: "09:30", interval: {...} }

// Immediately before writing to `appointments` — never trust the client:
const result = await bookingRules.validateBooking({
  practitionerId, date, timezone, startTime: "09:30", durationMinutes: 30,
});
if (!result.valid) {
  // result.reason: "past" | "outside_working_hours" | "break" | "blocked_period" | "booked" | "invalid_duration"
}
```

`generateDailySlots` returns the **full grid**, including unavailable
slots (each with an `unavailableReason`) — not a filtered "only bookable"
list. That's a deliberate design choice: it lets a UI show the whole day
with unavailable times struck through (as the current booking wizard
does), rather than a sparse, hard-to-scan list. A caller that only wants
bookable times can filter on `slot.available`.

## Not wired up yet

This milestone built the engine only. It is **not** connected to the
existing booking wizard (`features/booking`), which still runs on mocked
data — that integration, along with Google Calendar/Outlook/AI
receptionist/WhatsApp adapters, is future work this engine is designed to
support but doesn't itself implement.

## Testing

```bash
npm test
```

80 tests across engine (pure-function unit tests — working hours, breaks,
blocked periods, double bookings, overlapping appointments, fully-booked
days, next-available, timezone conversion, edge cases) and services
(integration tests against `InMemorySchedulingRepository`, no network, no
database).
