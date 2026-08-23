-- listing_ranks was created with `select l.*, ...` (migration 0001). Postgres
-- freezes a view's `*` expansion to the column list at CREATE VIEW time - it
-- does NOT pick up columns added to the underlying table later via ALTER
-- TABLE. Migrations 0011/0012 added location/licensed_insured/
-- years_in_business/availability/specialty_tags/starting_hourly_rate_cents/
-- min_project_cents to `listings`, but every query through this view (i.e.
-- every public leaderboard read - see lib/db/listings.ts's
-- listPublishedListingsForCategory) was silently missing all seven, even
-- though the underlying rows had the data.
--
-- `create or replace view` can't fix this either: Postgres only allows a
-- replace to *append* columns at the very end of the existing list, and
-- these need to land before the computed `rank` column, so the view has to
-- be dropped and recreated instead. Nothing else depends on it (no other
-- views/rules reference listing_ranks), so this is safe.
drop view if exists listing_ranks;

create view listing_ranks as
select
  l.*,
  row_number() over (
    partition by l.category_id
    order by l.bid_amount_cents desc, l.claimed_at asc, l.id asc
  ) as rank
from listings l
where l.status = 'published';
