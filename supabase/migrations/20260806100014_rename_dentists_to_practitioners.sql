-- Generalizes "dentist" to "practitioner" so a practice can have any mix of
-- specialties (dentist, GP, physiotherapist, psychiatrist, optometrist,
-- ...) each with their own independent diary. Straight rename — Postgres
-- preserves all rows/FKs/data, ALTER TABLE/COLUMN RENAME only changes
-- catalog metadata and is transparent to dependent constraints/indexes
-- (they keep working through the rename; only their own names are cosmetic
-- leftovers, renamed below for consistency).

-- 1. Core table.
alter table public.dentists rename to practitioners;
alter table public.practitioners rename constraint dentists_first_name_not_blank to practitioners_first_name_not_blank;
alter table public.practitioners rename constraint dentists_last_name_not_blank to practitioners_last_name_not_blank;
alter table public.practitioners rename constraint dentists_colour_code_format to practitioners_colour_code_format;
alter table public.practitioners rename constraint dentists_consultation_duration_positive to practitioners_consultation_duration_positive;
alter table public.practitioners rename constraint dentists_practice_id_email_key to practitioners_practice_id_email_key;
alter table public.practitioners rename constraint dentists_id_practice_id_key to practitioners_id_practice_id_key;
alter table public.practitioners rename constraint dentists_years_of_experience_check to practitioners_years_of_experience_check;
alter index dentists_pkey rename to practitioners_pkey;
alter index dentists_practice_id_idx rename to practitioners_practice_id_idx;
alter index dentists_practice_id_active_idx rename to practitioners_practice_id_active_idx;

comment on table public.practitioners is 'Practitioners belonging to a practice, any specialty (dentist, GP, physiotherapist, ...). One practice has many practitioners.';

-- Free text, not a fixed enum: the practice must be able to add a new
-- specialty (Psychiatrist, Optometrist, ...) without a code change. Default
-- only exists to backfill the two already-seeded dentists, then is dropped
-- so every future insert must specify one explicitly.
alter table public.practitioners add column profession text not null default 'Dentist';
alter table public.practitioners alter column profession drop default;
comment on column public.practitioners.profession is 'Free text (Dentist, GP, Physiotherapist, ...) — practice-defined, not a fixed set.';

alter policy "Members can manage their practice's dentists" on public.practitioners
  rename to "Members can manage their practice's practitioners";

-- 2. dentist_id -> practitioner_id everywhere, and the two dependent
-- weekly-schedule tables renamed to match.
alter table public.appointments rename column dentist_id to practitioner_id;
alter table public.appointments rename constraint appointments_dentist_fk to appointments_practitioner_fk;
alter index appointments_dentist_id_idx rename to appointments_practitioner_id_idx;
alter index appointments_dentist_id_date_idx rename to appointments_practitioner_id_date_idx;
alter index appointments_dentist_scheduled_range_gist_idx rename to appointments_practitioner_scheduled_range_gist_idx;

alter table public.dentist_working_hours rename to practitioner_working_hours;
alter table public.practitioner_working_hours rename column dentist_id to practitioner_id;
alter table public.practitioner_working_hours rename constraint dentist_working_hours_day_of_week_check to practitioner_working_hours_day_of_week_check;
alter table public.practitioner_working_hours rename constraint dentist_working_hours_time_range_check to practitioner_working_hours_time_range_check;
alter table public.practitioner_working_hours rename constraint dentist_working_hours_dentist_id_day_of_week_key to practitioner_working_hours_practitioner_id_day_of_week_key;
alter table public.practitioner_working_hours rename constraint dentist_working_hours_dentist_fk to practitioner_working_hours_practitioner_fk;
alter index dentist_working_hours_pkey rename to practitioner_working_hours_pkey;
alter index dentist_working_hours_practice_id_idx rename to practitioner_working_hours_practice_id_idx;
alter index dentist_working_hours_dentist_id_day_idx rename to practitioner_working_hours_practitioner_id_day_idx;
comment on table public.practitioner_working_hours is 'Recurring weekly working hours, one row per practitioner per day_of_week (0=Sunday..6=Saturday).';

alter table public.dentist_breaks rename to practitioner_breaks;
alter table public.practitioner_breaks rename column dentist_id to practitioner_id;
alter table public.practitioner_breaks rename constraint dentist_breaks_day_of_week_check to practitioner_breaks_day_of_week_check;
alter table public.practitioner_breaks rename constraint dentist_breaks_time_range_check to practitioner_breaks_time_range_check;
alter table public.practitioner_breaks rename constraint dentist_breaks_dentist_fk to practitioner_breaks_practitioner_fk;
alter index dentist_breaks_pkey rename to practitioner_breaks_pkey;
alter index dentist_breaks_practice_id_idx rename to practitioner_breaks_practice_id_idx;
alter index dentist_breaks_dentist_id_day_idx rename to practitioner_breaks_practitioner_id_day_idx;
comment on table public.practitioner_breaks is 'Recurring weekly breaks (lunch, admin time, ...) subtracted from working hours.';

-- (The "working hours"/"breaks" policy display names don't mention
-- "dentist" and need no rename — they already read correctly.)

alter table public.blocked_periods rename column dentist_id to practitioner_id;
alter table public.blocked_periods rename constraint blocked_periods_dentist_fk to blocked_periods_practitioner_fk;
alter index blocked_periods_dentist_id_range_idx rename to blocked_periods_practitioner_id_range_idx;

alter table public.google_calendar_connections rename column dentist_id to practitioner_id;
alter table public.google_calendar_connections rename constraint google_calendar_connections_dentist_fk to google_calendar_connections_practitioner_fk;
alter index google_calendar_connections_per_dentist_key rename to google_calendar_connections_per_practitioner_key;
comment on column public.google_calendar_connections.practitioner_id is 'Null = practice-wide connection. Non-null = this specific practitioner''s own calendar.';

-- 3. Per-practitioner treatment scoping — previously nonexistent (any
-- treatment could be booked with any dentist). Deliberately scoped to the
-- individual practitioner, not their profession, so e.g. two dentists can
-- offer different subsets of the practice's dental treatments.
create table public.practitioner_treatments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  practitioner_id uuid not null,
  treatment_id uuid not null,
  created_at timestamptz not null default now(),
  constraint practitioner_treatments_practitioner_id_treatment_id_key unique (practitioner_id, treatment_id),
  constraint practitioner_treatments_practitioner_fk foreign key (practitioner_id, practice_id)
    references public.practitioners (id, practice_id) on delete cascade,
  constraint practitioner_treatments_treatment_fk foreign key (treatment_id, practice_id)
    references public.treatment_types (id, practice_id) on delete cascade
);

comment on table public.practitioner_treatments is 'Which treatments/services each practitioner personally offers.';

create index practitioner_treatments_practice_id_idx on public.practitioner_treatments (practice_id);
create index practitioner_treatments_practitioner_id_idx on public.practitioner_treatments (practitioner_id);
create index practitioner_treatments_treatment_id_idx on public.practitioner_treatments (treatment_id);

alter table public.practitioner_treatments enable row level security;
create policy "Members can manage their practice's practitioner treatments"
  on public.practitioner_treatments
  for all
  using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());
