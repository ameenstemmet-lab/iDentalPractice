create table public.practices (
  id uuid primary key default gen_random_uuid(),
  practice_name text not null,
  registration_number text,
  email text not null,
  phone text,
  address text,
  city text,
  province text,
  postal_code text,
  logo_url text,
  timezone text not null default 'Africa/Johannesburg',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practices_practice_name_not_blank check (btrim(practice_name) <> ''),
  constraint practices_email_key unique (email),
  constraint practices_registration_number_key unique (registration_number)
);

comment on table public.practices is 'Tenant root. Every other table is scoped to a practice via practice_id.';

create trigger set_updated_at
  before update on public.practices
  for each row
  execute function public.set_updated_at();

create index practices_active_idx on public.practices (active);
