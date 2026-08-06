-- Recurring weekly working hours per dentist. One row per (dentist, day_of_week).
create table public.dentist_working_hours (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  dentist_id uuid not null,
  day_of_week smallint not null,
  start_time time,
  end_time time,
  is_working boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dentist_working_hours_day_of_week_check check (day_of_week between 0 and 6),
  constraint dentist_working_hours_time_range_check check (
    (is_working = false) or (start_time is not null and end_time is not null and start_time < end_time)
  ),
  constraint dentist_working_hours_dentist_id_day_of_week_key unique (dentist_id, day_of_week),
  constraint dentist_working_hours_dentist_fk foreign key (dentist_id, practice_id)
    references public.dentists (id, practice_id) on delete cascade
);

comment on table public.dentist_working_hours is 'Recurring weekly working hours, one row per dentist per day_of_week (0=Sunday..6=Saturday).';

create trigger set_updated_at
  before update on public.dentist_working_hours
  for each row
  execute function public.set_updated_at();

create index dentist_working_hours_practice_id_idx on public.dentist_working_hours (practice_id);
create index dentist_working_hours_dentist_id_day_idx on public.dentist_working_hours (dentist_id, day_of_week);

-- Recurring weekly breaks (lunch, etc). Multiple per dentist per day allowed.
create table public.dentist_breaks (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  dentist_id uuid not null,
  day_of_week smallint not null,
  start_time time not null,
  end_time time not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dentist_breaks_day_of_week_check check (day_of_week between 0 and 6),
  constraint dentist_breaks_time_range_check check (start_time < end_time),
  constraint dentist_breaks_dentist_fk foreign key (dentist_id, practice_id)
    references public.dentists (id, practice_id) on delete cascade
);

comment on table public.dentist_breaks is 'Recurring weekly breaks (lunch, admin time, ...) subtracted from working hours.';

create trigger set_updated_at
  before update on public.dentist_breaks
  for each row
  execute function public.set_updated_at();

create index dentist_breaks_practice_id_idx on public.dentist_breaks (practice_id);
create index dentist_breaks_dentist_id_day_idx on public.dentist_breaks (dentist_id, day_of_week);

-- One-off blocked periods (leave, holidays, personal time) as absolute instants.
create table public.blocked_periods (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  dentist_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blocked_periods_time_range_check check (starts_at < ends_at),
  constraint blocked_periods_dentist_fk foreign key (dentist_id, practice_id)
    references public.dentists (id, practice_id) on delete cascade
);

comment on table public.blocked_periods is 'One-off blocked time (leave, holidays, ad-hoc unavailability) as absolute instants.';

create trigger set_updated_at
  before update on public.blocked_periods
  for each row
  execute function public.set_updated_at();

create index blocked_periods_practice_id_idx on public.blocked_periods (practice_id);
create index blocked_periods_dentist_id_range_idx on public.blocked_periods (dentist_id, starts_at, ends_at);
