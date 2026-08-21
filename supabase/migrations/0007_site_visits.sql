-- Backs the sitewide "X people here right now" counter. One row per
-- browser (an anonymous cookie id, not tied to any listing/identity),
-- upserted on each page load; "recent" is just a time-window count, no
-- websockets or presence infra needed for a vanity metric like this.
create table site_visits (
  session_id text primary key,
  last_seen  timestamptz not null default now()
);

create index site_visits_last_seen_idx on site_visits (last_seen);
