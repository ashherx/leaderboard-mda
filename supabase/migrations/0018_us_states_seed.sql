-- Seeds the remaining 49 US states (Texas already exists from migration
-- 0016) under the United States country row, all *inactive*. This is
-- inventory, not a launch: an inactive state has no public board and
-- doesn't appear in the state switcher (see lib/db/locations.ts's
-- listActiveStates) until an admin flips it on from /admin/locations once
-- there's enough provider interest there to be worth a board of its own -
-- see migration 0016's comment and the product discussion this seed came
-- from.
--
-- display_order starts at 100 (Texas holds 0) so newly-activated states
-- don't jump ahead of it by default; alphabetical spacing of 10 apart
-- leaves room to reorder individual states later without a renumber.
insert into locations (parent_id, kind, name, slug, is_active, display_order)
select '00000000-0000-0000-0000-000000000001', 'state', v.name, v.slug, false, 100 + (v.ord * 10)
from (
  values
    (0, 'Alabama', 'alabama'),
    (1, 'Alaska', 'alaska'),
    (2, 'Arizona', 'arizona'),
    (3, 'Arkansas', 'arkansas'),
    (4, 'California', 'california'),
    (5, 'Colorado', 'colorado'),
    (6, 'Connecticut', 'connecticut'),
    (7, 'Delaware', 'delaware'),
    (8, 'Florida', 'florida'),
    (9, 'Georgia', 'georgia'),
    (10, 'Hawaii', 'hawaii'),
    (11, 'Idaho', 'idaho'),
    (12, 'Illinois', 'illinois'),
    (13, 'Indiana', 'indiana'),
    (14, 'Iowa', 'iowa'),
    (15, 'Kansas', 'kansas'),
    (16, 'Kentucky', 'kentucky'),
    (17, 'Louisiana', 'louisiana'),
    (18, 'Maine', 'maine'),
    (19, 'Maryland', 'maryland'),
    (20, 'Massachusetts', 'massachusetts'),
    (21, 'Michigan', 'michigan'),
    (22, 'Minnesota', 'minnesota'),
    (23, 'Mississippi', 'mississippi'),
    (24, 'Missouri', 'missouri'),
    (25, 'Montana', 'montana'),
    (26, 'Nebraska', 'nebraska'),
    (27, 'Nevada', 'nevada'),
    (28, 'New Hampshire', 'new-hampshire'),
    (29, 'New Jersey', 'new-jersey'),
    (30, 'New Mexico', 'new-mexico'),
    (31, 'New York', 'new-york'),
    (32, 'North Carolina', 'north-carolina'),
    (33, 'North Dakota', 'north-dakota'),
    (34, 'Ohio', 'ohio'),
    (35, 'Oklahoma', 'oklahoma'),
    (36, 'Oregon', 'oregon'),
    (37, 'Pennsylvania', 'pennsylvania'),
    (38, 'Rhode Island', 'rhode-island'),
    (39, 'South Carolina', 'south-carolina'),
    (40, 'South Dakota', 'south-dakota'),
    (41, 'Tennessee', 'tennessee'),
    (42, 'Utah', 'utah'),
    (43, 'Vermont', 'vermont'),
    (44, 'Virginia', 'virginia'),
    (45, 'Washington', 'washington'),
    (46, 'West Virginia', 'west-virginia'),
    (47, 'Wisconsin', 'wisconsin'),
    (48, 'Wyoming', 'wyoming')
) as v(ord, name, slug)
-- Idempotency guard, same reasoning as any seed migration: safe to re-run
-- without duplicating rows if it's ever applied twice.
where not exists (
  select 1 from locations l
  where l.parent_id = '00000000-0000-0000-0000-000000000001' and l.slug = v.slug
);
