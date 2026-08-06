create table public.treatment_types (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  treatment_name text not null,
  description text,
  duration_minutes integer not null,
  price numeric(10, 2) not null,
  colour text not null default '#10B981',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint treatment_types_treatment_name_not_blank check (btrim(treatment_name) <> ''),
  constraint treatment_types_duration_positive check (duration_minutes > 0),
  constraint treatment_types_price_non_negative check (price >= 0),
  constraint treatment_types_colour_format check (colour ~* '^#[0-9A-F]{6}$'),
  constraint treatment_types_practice_id_name_key unique (practice_id, treatment_name),
  -- Lets appointments FK on (treatment_id, practice_id) so a treatment type
  -- can never be attached to an appointment outside its own practice.
  constraint treatment_types_id_practice_id_key unique (id, practice_id)
);

comment on table public.treatment_types is 'Billable procedures a practice offers (cleaning, extraction, etc).';

create trigger set_updated_at
  before update on public.treatment_types
  for each row
  execute function public.set_updated_at();

create index treatment_types_practice_id_idx on public.treatment_types (practice_id);
create index treatment_types_practice_id_active_idx on public.treatment_types (practice_id, active);
