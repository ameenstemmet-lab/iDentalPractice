create table public.patients (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  cellphone text,
  email text,
  date_of_birth date,
  gender text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patients_first_name_not_blank check (btrim(first_name) <> ''),
  constraint patients_last_name_not_blank check (btrim(last_name) <> ''),
  constraint patients_gender_check check (gender is null or gender in ('female', 'male', 'other', 'prefer_not_to_say')),
  constraint patients_date_of_birth_not_future check (date_of_birth is null or date_of_birth <= current_date),
  -- Lets appointments FK on (patient_id, practice_id) so a patient can never
  -- be attached to an appointment outside their own practice.
  constraint patients_id_practice_id_key unique (id, practice_id)
);

comment on table public.patients is 'Patients registered with a practice.';

create trigger set_updated_at
  before update on public.patients
  for each row
  execute function public.set_updated_at();

create index patients_practice_id_idx on public.patients (practice_id);
create index patients_practice_id_last_name_idx on public.patients (practice_id, last_name);
create index patients_cellphone_idx on public.patients (cellphone);
create index patients_email_idx on public.patients (email);
