-- Application-level conflict checks (see features/scheduling) give fast,
-- friendly errors, but cannot fully close the race window between two
-- concurrent booking requests. This constraint is the database-level
-- backstop: it is impossible for two non-cancelled appointments for the
-- same dentist to have overlapping time ranges, even under concurrency.
create extension if not exists btree_gist with schema extensions;

alter table public.appointments
  add column scheduled_range tsrange generated always as (
    tsrange(appointment_date + start_time, appointment_date + end_time, '[)')
  ) stored;

comment on column public.appointments.scheduled_range is
  'Derived local-time range of the appointment, used only for overlap detection (see appointments_no_overlap).';

create index appointments_dentist_scheduled_range_gist_idx
  on public.appointments using gist (dentist_id, scheduled_range);

alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    dentist_id with =,
    scheduled_range with &&
  )
  where (status <> 'cancelled' and status <> 'no_show');
