-- Backs duplicate-URL detection (see lib/link-policy.ts's normalizeUrlKey,
-- the single source of truth for the normalization rules - this column is
-- just a cache of that function's output, kept in sync by the app on every
-- insert/update, not computed here). No unique constraint: a genuine
-- duplicate is meant to become a re-bid of the existing listing rather than
-- be rejected outright, and that decision happens in application code
-- (submitListingAndCheckout) before any insert - this index only makes that
-- lookup fast, it isn't the enforcement mechanism.
alter table listings add column destination_link_key text;

create index listings_destination_link_key_idx
  on listings (destination_link_key)
  where status in ('pending_payment', 'published');

-- Best-effort backfill for existing rows, approximating normalizeUrlKey in
-- SQL (lowercase host, drop a leading "www.", strip querystring/fragment,
-- drop a trailing slash). Good enough for existing demo/seed data; exact
-- parity with the TS implementation only matters for rows written from here
-- on, which always go through the app.
update listings
set destination_link_key = regexp_replace(
  lower(regexp_replace(regexp_replace(destination_link, '^https?://(www\.)?', ''), '[?#].*$', '')),
  '/+$', ''
)
where destination_link_key is null;
