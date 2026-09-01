-- Documents schema that already exists on the linked remote project but was
-- never captured in a migration file: an earlier attempt at this same
-- location feature was applied directly against the database (outside
-- `supabase db push`), so `locations`/`listings.location_id`/etc already
-- exist in production with real data, but this repo's migration history and
-- app code never caught up. This migration exists so a fresh environment
-- (local dev, staging) ends up with the same schema production already has -
-- it is a record of what's already true, not a new change.
--
-- Chosen over building a flat `states` table: this is hierarchical
-- (country -> state -> city via `location_kind` + self-referencing
-- parent_id), which is exactly the room needed for city-level boards later
-- without another migration to bolt on a parent dimension retroactively.
--
-- A listing's podium position is unique per (category, location) - see the
-- listing_ranks view below - so "#1 plumber" means #1 in a place with real
-- local demand, not #1 nationally.

create type location_kind as enum ('country', 'state', 'city');

create table locations (
  id            uuid primary key default gen_random_uuid(),
  parent_id     uuid references locations (id) on delete restrict,
  kind          location_kind not null,
  name          text not null,
  slug          text not null,
  is_active     boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint locations_kind_parent_check check (
    (kind = 'country' and parent_id is null) or (kind in ('state', 'city') and parent_id is not null)
  )
);

-- Countries are unique by slug globally; states/cities are unique by slug
-- within their parent (so "Austin, TX" and a hypothetical "Austin, MN"
-- don't collide).
create unique index locations_country_slug_idx on locations (slug) where parent_id is null;
create unique index locations_slug_per_parent_idx on locations (parent_id, slug) where parent_id is not null;
create index locations_kind_active_order_idx on locations (kind, is_active, display_order);
create index locations_parent_id_idx on locations (parent_id);

create trigger locations_set_updated_at
  before update on locations
  for each row execute function set_updated_at();

insert into locations (id, kind, name, slug, display_order) values
  ('00000000-0000-0000-0000-000000000001', 'country', 'United States', 'us', 0);

-- Every US state, seeded inactive except Texas - matches launch scope
-- (only states with real local demand get turned on, from the admin
-- panel's Locations page, same is_active toggle categories already use).
insert into locations (parent_id, name, slug, kind, is_active, display_order) values
  ('00000000-0000-0000-0000-000000000001', 'Texas', 'texas', 'state', true, 0),
  ('00000000-0000-0000-0000-000000000001', 'Alabama', 'alabama', 'state', false, 100),
  ('00000000-0000-0000-0000-000000000001', 'Alaska', 'alaska', 'state', false, 110),
  ('00000000-0000-0000-0000-000000000001', 'Arizona', 'arizona', 'state', false, 120),
  ('00000000-0000-0000-0000-000000000001', 'Arkansas', 'arkansas', 'state', false, 130),
  ('00000000-0000-0000-0000-000000000001', 'California', 'california', 'state', false, 140),
  ('00000000-0000-0000-0000-000000000001', 'Colorado', 'colorado', 'state', false, 150),
  ('00000000-0000-0000-0000-000000000001', 'Connecticut', 'connecticut', 'state', false, 160),
  ('00000000-0000-0000-0000-000000000001', 'Delaware', 'delaware', 'state', false, 170),
  ('00000000-0000-0000-0000-000000000001', 'Florida', 'florida', 'state', false, 180),
  ('00000000-0000-0000-0000-000000000001', 'Georgia', 'georgia', 'state', false, 190),
  ('00000000-0000-0000-0000-000000000001', 'Hawaii', 'hawaii', 'state', false, 200),
  ('00000000-0000-0000-0000-000000000001', 'Idaho', 'idaho', 'state', false, 210),
  ('00000000-0000-0000-0000-000000000001', 'Illinois', 'illinois', 'state', false, 220),
  ('00000000-0000-0000-0000-000000000001', 'Indiana', 'indiana', 'state', false, 230),
  ('00000000-0000-0000-0000-000000000001', 'Iowa', 'iowa', 'state', false, 240),
  ('00000000-0000-0000-0000-000000000001', 'Kansas', 'kansas', 'state', false, 250),
  ('00000000-0000-0000-0000-000000000001', 'Kentucky', 'kentucky', 'state', false, 260),
  ('00000000-0000-0000-0000-000000000001', 'Louisiana', 'louisiana', 'state', false, 270),
  ('00000000-0000-0000-0000-000000000001', 'Maine', 'maine', 'state', false, 280),
  ('00000000-0000-0000-0000-000000000001', 'Maryland', 'maryland', 'state', false, 290),
  ('00000000-0000-0000-0000-000000000001', 'Massachusetts', 'massachusetts', 'state', false, 300),
  ('00000000-0000-0000-0000-000000000001', 'Michigan', 'michigan', 'state', false, 310),
  ('00000000-0000-0000-0000-000000000001', 'Minnesota', 'minnesota', 'state', false, 320),
  ('00000000-0000-0000-0000-000000000001', 'Mississippi', 'mississippi', 'state', false, 330),
  ('00000000-0000-0000-0000-000000000001', 'Missouri', 'missouri', 'state', false, 340),
  ('00000000-0000-0000-0000-000000000001', 'Montana', 'montana', 'state', false, 350),
  ('00000000-0000-0000-0000-000000000001', 'Nebraska', 'nebraska', 'state', false, 360),
  ('00000000-0000-0000-0000-000000000001', 'Nevada', 'nevada', 'state', false, 370),
  ('00000000-0000-0000-0000-000000000001', 'New Hampshire', 'new-hampshire', 'state', false, 380),
  ('00000000-0000-0000-0000-000000000001', 'New Jersey', 'new-jersey', 'state', false, 390),
  ('00000000-0000-0000-0000-000000000001', 'New Mexico', 'new-mexico', 'state', false, 400),
  ('00000000-0000-0000-0000-000000000001', 'New York', 'new-york', 'state', false, 410),
  ('00000000-0000-0000-0000-000000000001', 'North Carolina', 'north-carolina', 'state', false, 420),
  ('00000000-0000-0000-0000-000000000001', 'North Dakota', 'north-dakota', 'state', false, 430),
  ('00000000-0000-0000-0000-000000000001', 'Ohio', 'ohio', 'state', false, 440),
  ('00000000-0000-0000-0000-000000000001', 'Oklahoma', 'oklahoma', 'state', false, 450),
  ('00000000-0000-0000-0000-000000000001', 'Oregon', 'oregon', 'state', false, 460),
  ('00000000-0000-0000-0000-000000000001', 'Pennsylvania', 'pennsylvania', 'state', false, 470),
  ('00000000-0000-0000-0000-000000000001', 'Rhode Island', 'rhode-island', 'state', false, 480),
  ('00000000-0000-0000-0000-000000000001', 'South Carolina', 'south-carolina', 'state', false, 490),
  ('00000000-0000-0000-0000-000000000001', 'South Dakota', 'south-dakota', 'state', false, 500),
  ('00000000-0000-0000-0000-000000000001', 'Tennessee', 'tennessee', 'state', false, 510),
  ('00000000-0000-0000-0000-000000000001', 'Utah', 'utah', 'state', false, 520),
  ('00000000-0000-0000-0000-000000000001', 'Vermont', 'vermont', 'state', false, 530),
  ('00000000-0000-0000-0000-000000000001', 'Virginia', 'virginia', 'state', false, 540),
  ('00000000-0000-0000-0000-000000000001', 'Washington', 'washington', 'state', false, 550),
  ('00000000-0000-0000-0000-000000000001', 'West Virginia', 'west-virginia', 'state', false, 560),
  ('00000000-0000-0000-0000-000000000001', 'Wisconsin', 'wisconsin', 'state', false, 570),
  ('00000000-0000-0000-0000-000000000001', 'Wyoming', 'wyoming', 'state', false, 580);

-- ---------------------------------------------------------------------------
-- listings.location_id
-- ---------------------------------------------------------------------------
alter table listings add column location_id uuid references locations (id) on delete restrict;

update listings set location_id = (select id from locations where slug = 'texas');

alter table listings alter column location_id set not null;

drop index if exists listings_category_status_rank_idx;
create index listings_category_location_status_rank_idx
  on listings (category_id, location_id, status, bid_amount_cents desc, claimed_at asc);

-- ---------------------------------------------------------------------------
-- click_events.location_id (parity with category_id)
-- ---------------------------------------------------------------------------
alter table click_events add column location_id uuid references locations (id) on delete cascade;

update click_events ce set location_id = l.location_id
from listings l
where l.id = ce.listing_id;

alter table click_events alter column location_id set not null;

drop index if exists click_events_category_created_idx;
create index click_events_category_location_created_idx on click_events (category_id, location_id, created_at desc);

-- ---------------------------------------------------------------------------
-- listing_ranks: rank is now unique per (category_id, location_id)
-- ---------------------------------------------------------------------------
-- Can't use `create or replace view` here: l.* now includes location_id
-- right before the computed `rank` column, and Postgres only allows a
-- replace to *append* new columns strictly after the old column list (see
-- migration 0013 for the same issue). Nothing else depends on this view.
drop view if exists listing_ranks;

create view listing_ranks as
select
  l.*,
  row_number() over (
    partition by l.category_id, l.location_id
    order by l.bid_amount_cents desc, l.claimed_at asc, l.id asc
  ) as rank
from listings l
where l.status = 'published';

-- ---------------------------------------------------------------------------
-- pricing helper: what does it cost to claim #1 right now, in this category+location?
-- ---------------------------------------------------------------------------
drop function if exists category_top_price_cents(uuid);

create or replace function category_top_price_cents(p_category_id uuid, p_location_id uuid)
returns integer as $$
declare
  v_current_top integer;
  v_min_bid integer;
begin
  select min_bid_cents into v_min_bid from categories where id = p_category_id;

  select bid_amount_cents into v_current_top
  from listings
  where category_id = p_category_id and location_id = p_location_id and status = 'published'
  order by bid_amount_cents desc, claimed_at asc, id asc
  limit 1;

  if v_current_top is null then
    return v_min_bid; -- board is empty: minimum bid claims #1
  end if;

  return v_current_top + 100; -- one dollar more than the current #1
end;
$$ language plpgsql stable;
