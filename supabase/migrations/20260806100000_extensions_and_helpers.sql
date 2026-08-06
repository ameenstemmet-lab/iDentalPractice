-- Extensions
create extension if not exists "pgcrypto" with schema extensions;

-- Keeps `updated_at` in sync on every row update. Attached as a BEFORE UPDATE
-- trigger on each table below.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Resolves the calling user's practice from their JWT app_metadata. RLS
-- policies use this to scope every table to a single tenant. app_metadata.
-- practice_id is populated when staff accounts are provisioned (auth
-- milestone) — until then this returns null and tenant-scoped policies deny
-- access by default.
create or replace function public.current_practice_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'practice_id', '')::uuid;
$$;
