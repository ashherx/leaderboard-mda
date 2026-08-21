-- Lightweight report queue — no moderation UI yet (per the blueprint's Phase
-- 2 scope), just a place reports land so they can be reviewed via the
-- Supabase dashboard or a future admin screen.
create type report_status as enum ('open', 'reviewed', 'dismissed');

create table reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings (id) on delete cascade,
  reason      text not null check (char_length(reason) <= 60),
  details     text check (details is null or char_length(details) <= 500),
  status      report_status not null default 'open',
  created_at  timestamptz not null default now()
);

create index reports_listing_id_idx on reports (listing_id);
create index reports_status_idx on reports (status);
