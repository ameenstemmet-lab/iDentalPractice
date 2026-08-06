-- The public booking flow's premium dentist cards display qualification,
-- special interests, and years of experience — fields that didn't exist
-- when the original schema was designed, before that UI existed.
alter table public.dentists
  add column qualification text,
  add column special_interests text[] not null default '{}',
  add column years_of_experience integer;

alter table public.dentists
  add constraint dentists_years_of_experience_check check (years_of_experience is null or years_of_experience >= 0);

comment on column public.dentists.special_interests is 'Short tags shown on the public booking flow, e.g. "Cosmetic dentistry", "Root canal therapy".';
