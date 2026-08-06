create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  patient_id uuid not null,
  dentist_id uuid not null,
  treatment_id uuid not null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'booked',
  google_calendar_event_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_status_check check (status in ('booked', 'confirmed', 'completed', 'cancelled', 'no_show')),
  constraint appointments_time_range_check check (end_time > start_time),
  -- Each reference is pinned to the same practice_id as the appointment
  -- itself, so a patient/dentist/treatment from another practice can never
  -- be attached — tenant isolation enforced at the schema level, not just RLS.
  constraint appointments_patient_fk foreign key (patient_id, practice_id)
    references public.patients (id, practice_id) on delete restrict,
  constraint appointments_dentist_fk foreign key (dentist_id, practice_id)
    references public.dentists (id, practice_id) on delete restrict,
  constraint appointments_treatment_fk foreign key (treatment_id, practice_id)
    references public.treatment_types (id, practice_id) on delete restrict
);

comment on table public.appointments is 'Scheduled visits linking a patient, dentist and treatment type within a practice.';

create trigger set_updated_at
  before update on public.appointments
  for each row
  execute function public.set_updated_at();

create index appointments_practice_id_idx on public.appointments (practice_id);
create index appointments_patient_id_idx on public.appointments (patient_id);
create index appointments_dentist_id_idx on public.appointments (dentist_id);
create index appointments_treatment_id_idx on public.appointments (treatment_id);
create index appointments_practice_id_date_idx on public.appointments (practice_id, appointment_date);
create index appointments_dentist_id_date_idx on public.appointments (dentist_id, appointment_date, start_time);

-- A Google Calendar event can back at most one appointment.
create unique index appointments_google_calendar_event_id_key
  on public.appointments (google_calendar_event_id)
  where google_calendar_event_id is not null;
