alter table public.dentist_working_hours enable row level security;
alter table public.dentist_breaks enable row level security;
alter table public.blocked_periods enable row level security;

create policy "Members can manage their practice's working hours"
  on public.dentist_working_hours
  for all
  using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());

create policy "Members can manage their practice's breaks"
  on public.dentist_breaks
  for all
  using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());

create policy "Members can manage their practice's blocked periods"
  on public.blocked_periods
  for all
  using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());
