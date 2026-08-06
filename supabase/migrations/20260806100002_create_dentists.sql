create table public.dentists (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  title text,
  email text,
  cellphone text,
  colour_code text not null default '#2563EB',
  consultation_duration integer not null default 30,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dentists_first_name_not_blank check (btrim(first_name) <> ''),
  constraint dentists_last_name_not_blank check (btrim(last_name) <> ''),
  constraint dentists_colour_code_format check (colour_code ~* '^#[0-9A-F]{6}$'),
  constraint dentists_consultation_duration_positive check (consultation_duration > 0),
  constraint dentists_practice_id_email_key unique (practice_id, email),
  -- Lets appointments FK on (dentist_id, practice_id) so a dentist can never
  -- be attached to an appointment outside their own practice.
  constraint dentists_id_practice_id_key unique (id, practice_id)
);

comment on table public.dentists is 'Practitioners belonging to a practice. One practice has many dentists.';

create trigger set_updated_at
  before update on public.dentists
  for each row
  execute function public.set_updated_at();

create index dentists_practice_id_idx on public.dentists (practice_id);
create index dentists_practice_id_active_idx on public.dentists (practice_id, active);
