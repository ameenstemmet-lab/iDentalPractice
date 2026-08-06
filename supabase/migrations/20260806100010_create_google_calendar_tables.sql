-- Practice-visible connection metadata. Tokens live in a separate table
-- (google_calendar_tokens) with no client-facing RLS policy at all, so a
-- leaked anon/authenticated role can see *that* a calendar is connected
-- and its status, but never the credentials themselves.
create table public.google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  -- Null = practice-wide connection. Non-null = this specific dentist's
  -- own calendar (supports one dentist per calendar, or a shared front
  -- desk calendar — the practice chooses per connection).
  dentist_id uuid,
  -- Only 'google' is implemented today; the column exists so Outlook/Apple
  -- Calendar can be added as additional rows without a schema change.
  provider text not null default 'google',
  google_account_email text not null,
  calendar_id text not null default 'primary',
  calendar_summary text,
  status text not null default 'connected',
  sync_enabled boolean not null default true,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint google_calendar_connections_provider_check check (provider = 'google'),
  constraint google_calendar_connections_status_check check (status in ('connected', 'error', 'disconnected')),
  constraint google_calendar_connections_dentist_fk foreign key (dentist_id, practice_id)
    references public.dentists (id, practice_id) on delete cascade
);

comment on table public.google_calendar_connections is 'Practice-visible calendar connection metadata. Credentials live in google_calendar_tokens, never here.';

create trigger set_updated_at
  before update on public.google_calendar_connections
  for each row
  execute function public.set_updated_at();

create index google_calendar_connections_practice_id_idx on public.google_calendar_connections (practice_id);

-- At most one practice-wide connection (dentist_id is null) and at most
-- one connection per dentist.
create unique index google_calendar_connections_practice_wide_key
  on public.google_calendar_connections (practice_id)
  where dentist_id is null;
create unique index google_calendar_connections_per_dentist_key
  on public.google_calendar_connections (practice_id, dentist_id)
  where dentist_id is not null;

-- Encrypted OAuth credentials. Deliberately no RLS policy is added for any
-- client role in the next migration — only the service role (which
-- bypasses RLS) can ever read or write this table.
create table public.google_calendar_tokens (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null unique references public.google_calendar_connections (id) on delete cascade,
  encrypted_access_token text not null,
  encrypted_refresh_token text not null,
  access_token_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.google_calendar_tokens is 'AES-256-GCM encrypted OAuth tokens. No client-facing RLS policy exists for this table — service-role only.';

create trigger set_updated_at
  before update on public.google_calendar_tokens
  for each row
  execute function public.set_updated_at();

-- Durable outbox for appointment -> Google Calendar sync. A row here is a
-- unit of work, retried with backoff until it succeeds or exhausts its
-- attempts — never fire-and-forget.
create table public.calendar_sync_queue (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  connection_id uuid not null references public.google_calendar_connections (id) on delete cascade,
  operation text not null,
  status text not null default 'pending',
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_sync_queue_operation_check check (operation in ('create', 'update', 'cancel')),
  constraint calendar_sync_queue_status_check check (status in ('pending', 'processing', 'succeeded', 'failed')),
  constraint calendar_sync_queue_attempts_check check (attempts >= 0)
);

comment on table public.calendar_sync_queue is 'Outbox for appointment -> Google Calendar sync jobs. Processed by SyncQueueService, retried with exponential backoff.';

create trigger set_updated_at
  before update on public.calendar_sync_queue
  for each row
  execute function public.set_updated_at();

create index calendar_sync_queue_practice_id_idx on public.calendar_sync_queue (practice_id);
create index calendar_sync_queue_appointment_id_idx on public.calendar_sync_queue (appointment_id);
-- Drives the retry sweep: "give me pending work whose time has come".
create index calendar_sync_queue_retry_idx on public.calendar_sync_queue (status, next_attempt_at);

-- At most one pending/processing job per (appointment, operation) at a
-- time — the database-level guard against duplicate sync attempts.
create unique index calendar_sync_queue_dedupe_key
  on public.calendar_sync_queue (appointment_id, operation)
  where status in ('pending', 'processing');
