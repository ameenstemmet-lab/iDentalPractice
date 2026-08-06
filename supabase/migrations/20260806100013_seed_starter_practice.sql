-- Seeds one starter practice with two dentists, common treatment types, and
-- Mon-Fri working hours, so the public booking flow and Reception portal
-- have real data instead of an empty state. Everything here is editable or
-- deletable afterward through the Reception portal (Dentists, Treatments,
-- Working Hours, Settings pages).
with new_practice as (
  insert into public.practices (practice_name, email, phone, city, province, timezone)
  values (
    'Stemmet Dental',
    'info@stemmetdental.co.za',
    '+27 21 000 0000',
    'Cape Town',
    'Western Cape',
    'Africa/Johannesburg'
  )
  returning id
),
new_dentists as (
  insert into public.dentists (
    practice_id, first_name, last_name, title, email, consultation_duration,
    colour_code, qualification, special_interests, years_of_experience
  )
  select
    new_practice.id, v.first_name, v.last_name, v.title, v.email, v.consultation_duration,
    v.colour_code, v.qualification, v.special_interests, v.years_of_experience
  from new_practice, (values
    ('Anisha', 'Naidoo', 'Dr.', 'anisha.naidoo@stemmetdental.co.za', 30, '#2563EB',
     'BChD (Pretoria)', array['Cosmetic dentistry', 'Root canal therapy']::text[], 12),
    ('Marco', 'van Wyk', 'Dr.', 'marco.vanwyk@stemmetdental.co.za', 30, '#7C3AED',
     'BDS (Wits)', array['Paediatric dentistry', 'Oral surgery']::text[], 8)
  ) as v(first_name, last_name, title, email, consultation_duration, colour_code,
         qualification, special_interests, years_of_experience)
  returning id, practice_id
),
new_treatments as (
  insert into public.treatment_types (practice_id, treatment_name, description, duration_minutes, price, colour)
  select new_practice.id, v.treatment_name, v.description, v.duration_minutes, v.price, v.colour
  from new_practice, (values
    ('Consultation', 'General check-up and assessment', 30, 450, '#10B981'),
    ('Scale and Polish', 'Professional cleaning and polish', 45, 650, '#0EA5E9'),
    ('Filling', 'Composite filling for a single tooth', 45, 950, '#F59E0B'),
    ('Extraction', 'Single tooth extraction', 30, 850, '#EF4444')
  ) as v(treatment_name, description, duration_minutes, price, colour)
  returning id
),
working_hours as (
  insert into public.dentist_working_hours (practice_id, dentist_id, day_of_week, start_time, end_time, is_working)
  select
    d.practice_id,
    d.id,
    dow.day_of_week,
    case when dow.day_of_week between 1 and 5 then time '08:00' else null end,
    case when dow.day_of_week between 1 and 5 then time '17:00' else null end,
    dow.day_of_week between 1 and 5
  from new_dentists d
  cross join (select generate_series(0, 6) as day_of_week) dow
  returning id
)
select 1;
