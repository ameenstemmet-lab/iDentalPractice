alter table public.practices enable row level security;
alter table public.dentists enable row level security;
alter table public.treatment_types enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;

-- practices: members can see and update their own practice. No insert/delete
-- policy is defined — provisioning a practice is a service_role operation
-- (handled in the auth/onboarding milestone), and service_role bypasses RLS.
create policy "Members can view their own practice"
  on public.practices
  for select
  using (id = public.current_practice_id());

create policy "Members can update their own practice"
  on public.practices
  for update
  using (id = public.current_practice_id())
  with check (id = public.current_practice_id());

-- Remaining tables: every action is scoped to the caller's practice_id.
create policy "Members can manage their practice's dentists"
  on public.dentists
  for all
  using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());

create policy "Members can manage their practice's treatment types"
  on public.treatment_types
  for all
  using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());

create policy "Members can manage their practice's patients"
  on public.patients
  for all
  using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());

create policy "Members can manage their practice's appointments"
  on public.appointments
  for all
  using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());
