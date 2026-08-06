alter table public.google_calendar_connections enable row level security;
alter table public.google_calendar_tokens enable row level security;
alter table public.calendar_sync_queue enable row level security;

-- Connection metadata (email, calendar name, status) is safe for practice
-- members to see and manage.
create policy "Members can manage their practice's calendar connections"
  on public.google_calendar_connections
  for all
  using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());

-- google_calendar_tokens intentionally has NO policies for any client
-- role. RLS is enabled with zero grants, so every access from the
-- anon/authenticated roles is denied by default; only the service role
-- (used exclusively by server-side code in this module) can read or write
-- encrypted credentials.

-- Sync history is useful for an admin to see (and debug failures), but
-- only server-side code (service role) enqueues or mutates jobs.
create policy "Members can view their practice's sync queue"
  on public.calendar_sync_queue
  for select
  using (practice_id = public.current_practice_id());
