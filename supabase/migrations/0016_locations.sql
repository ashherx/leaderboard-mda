-- Location hierarchy: country -> state -> city, self-referencing so a later
-- city rollout needs no new table, just rows with kind='city' and a state
-- parent_id. Admin-managed the same way categories are (is_active,
-- display_order) - see lib/db/locations.ts and
-- app/admin/(dashboard)/locations for the CRUD surface.
--
-- This is a separate dimension from listings.location (the free-text
-- "Austin, TX" shown on a listing's card, added in migration 0011) - that
-- stays exactly what it is, a display string. This table is what a
-- listing's rank is scoped by (see migration 0017).
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

  -- A country has no parent; a state's or city's parent is required.
  -- Enforced here (not just app-side) since a malformed row would corrupt
  -- the public [state] route's lookups.
  constraint locations_kind_parent_check check (
    (kind = 'country' and parent_id is null) or
    (kind in ('state', 'city') and parent_id is not null)
  )
);

-- Slugs only need to be unique among siblings (Texas the state and some
-- future city named Texas shouldn't collide) - a country has no parent, so
-- it gets its own partial unique index: a plain unique(parent_id, slug)
-- wouldn't catch two countries both with parent_id null, since NULL is
-- never equal to NULL in a unique constraint.
create unique index locations_slug_per_parent_idx on locations (parent_id, slug) where parent_id is not null;
create unique index locations_country_slug_idx on locations (slug) where parent_id is null;

create index locations_kind_active_order_idx on locations (kind, is_active, display_order);
create index locations_parent_id_idx on locations (parent_id);

create trigger locations_set_updated_at
  before update on locations
  for each row execute function set_updated_at();

-- Seed: United States, active, with only Texas active under it. Every other
-- state can be added and switched on from the admin panel once there's
-- enough provider interest there - launching all 50 at once would mean ~50
-- mostly-empty boards, which undermines the "enough hype to be worth
-- claiming #1" premise the whole product depends on.
insert into locations (id, parent_id, kind, name, slug, is_active, display_order)
values ('00000000-0000-0000-0000-000000000001', null, 'country', 'United States', 'us', true, 0);

insert into locations (parent_id, kind, name, slug, is_active, display_order)
values ('00000000-0000-0000-0000-000000000001', 'state', 'Texas', 'texas', true, 0);
