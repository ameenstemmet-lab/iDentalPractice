-- Backfills practitioner_treatments for the two already-seeded dentists
-- (previously any dentist could be booked for any treatment; the new
-- per-practitioner scoping must not silently take that away), then adds a
-- GP and a Physiotherapist to the same practice, each with their own
-- working hours and their own treatment list, proving multiple professions
-- with independent diaries work end to end.

with practice as (
  select id, timezone from public.practices limit 1
),
existing_dentists as (
  select id from public.practitioners where profession = 'Dentist'
),
existing_treatments as (
  select id from public.treatment_types
)
insert into public.practitioner_treatments (practice_id, practitioner_id, treatment_id)
select practice.id, d.id, t.id
from practice, existing_dentists d, existing_treatments t
on conflict (practitioner_id, treatment_id) do nothing;

with practice as (
  select id from public.practices limit 1
),
new_practitioners as (
  insert into public.practitioners (
    practice_id, first_name, last_name, title, email, consultation_duration,
    colour_code, profession, qualification, special_interests, years_of_experience
  )
  select
    practice.id, v.first_name, v.last_name, v.title, v.email, v.consultation_duration,
    v.colour_code, v.profession, v.qualification, v.special_interests, v.years_of_experience
  from practice, (values
    ('Naledi', 'Khumalo', 'Dr.', 'naledi.khumalo@stemmetdental.co.za', 20, '#059669',
     'GP', 'MBChB (UCT)', array['Family medicine', 'Chronic disease management']::text[], 10),
    ('Werner', 'Botha', 'Mr.', 'werner.botha@stemmetdental.co.za', 45, '#DB2777',
     'Physiotherapist', 'BSc Physiotherapy (Stellenbosch)', array['Sports injuries', 'Post-surgical rehab']::text[], 6)
  ) as v(first_name, last_name, title, email, consultation_duration, colour_code,
         profession, qualification, special_interests, years_of_experience)
  returning id, practice_id, profession
),
new_treatments as (
  insert into public.treatment_types (practice_id, treatment_name, description, duration_minutes, price, colour)
  select practice.id, v.treatment_name, v.description, v.duration_minutes, v.price, v.colour
  from practice, (values
    ('General Consultation', 'General health check and assessment', 20, 550, '#059669'),
    ('Chronic Medication Review', 'Review and repeat prescription for chronic conditions', 15, 350, '#059669'),
    ('Initial Assessment', 'First physiotherapy session and treatment plan', 45, 750, '#DB2777'),
    ('Physiotherapy Session', 'Follow-up treatment session', 45, 550, '#DB2777'),
    ('Sports Injury Rehab', 'Targeted rehabilitation for a sports injury', 60, 850, '#DB2777')
  ) as v(treatment_name, description, duration_minutes, price, colour)
  returning id, treatment_name
),
working_hours as (
  insert into public.practitioner_working_hours (practice_id, practitioner_id, day_of_week, start_time, end_time, is_working)
  select
    p.practice_id,
    p.id,
    dow.day_of_week,
    case when dow.day_of_week between 1 and 5 then time '08:00' else null end,
    case when dow.day_of_week between 1 and 5 then time '17:00' else null end,
    dow.day_of_week between 1 and 5
  from new_practitioners p
  cross join (select generate_series(0, 6) as day_of_week) dow
  returning id
),
gp_treatments as (
  insert into public.practitioner_treatments (practice_id, practitioner_id, treatment_id)
  select p.practice_id, p.id, t.id
  from new_practitioners p
  join new_treatments t on t.treatment_name in ('General Consultation', 'Chronic Medication Review')
  where p.profession = 'GP'
  returning id
)
insert into public.practitioner_treatments (practice_id, practitioner_id, treatment_id)
select p.practice_id, p.id, t.id
from new_practitioners p
join new_treatments t on t.treatment_name in ('Initial Assessment', 'Physiotherapy Session', 'Sports Injury Rehab')
where p.profession = 'Physiotherapist';
