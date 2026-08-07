-- URL-safe identifier for the public booking page (/book/[practiceSlug]) now
-- that more than one practice can exist. Backfilled for the existing seeded
-- practice before being made required, mirroring how `profession` was
-- backfilled-then-required on practitioners.
alter table public.practices add column slug text;

update public.practices
set slug = lower(regexp_replace(regexp_replace(practice_name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
where slug is null;

alter table public.practices alter column slug set not null;
alter table public.practices add constraint practices_slug_key unique (slug);
alter table public.practices add constraint practices_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

comment on column public.practices.slug is 'URL-safe identifier for the public booking page, e.g. /book/stemmet-dental. Chosen at signup, generated from the practice name.';
