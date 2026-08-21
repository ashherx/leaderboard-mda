-- Timestamped click log, alongside listings.click_count (which stays as the
-- fast running total shown on every row). This is what makes "trending"
-- honest: a real count of clicks in a trailing window, not a relabeled
-- lifetime total. category_id is denormalized from the listing at insert
-- time so trending queries don't need a join.
create table click_events (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references listings (id) on delete cascade,
  category_id  uuid not null references categories (id) on delete cascade,
  created_at   timestamptz not null default now()
);

create index click_events_category_created_idx on click_events (category_id, created_at desc);
create index click_events_listing_id_idx on click_events (listing_id);
