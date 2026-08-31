-- Ranking scope widens from category_id alone to (category_id, location_id):
-- a listing is now unique to one category+state pair, not just one
-- category. A provider wanting Plumbing in both Texas and Oklahoma needs two
-- listings (and two payments) - same as wanting Plumbing and Roofing
-- already required two listings. See migration 0016's comment for why.
alter table listings add column location_id uuid references locations (id) on delete restrict;

-- Backfill: every listing that predates this column (all demo/seed data,
-- and anything claimed before this migration ran) becomes a Texas listing,
-- since Texas is the only location active at migration time. Anything that
-- genuinely belongs elsewhere can be reassigned from admin afterwards, the
-- same way category reassignment already works (see updateListingDetails).
update listings
set location_id = (select id from locations where slug = 'texas' and parent_id is not null)
where location_id is null;

alter table listings alter column location_id set not null;

-- Old index was (category_id, status, bid_amount_cents desc, claimed_at asc)
-- - rebuilt with location_id folded into the partition key so it still
-- covers listing_ranks' ordering under the new scope.
drop index if exists listings_category_status_rank_idx;
create index listings_category_location_status_rank_idx
  on listings (category_id, location_id, status, bid_amount_cents desc, claimed_at asc);

-- Rebuilt (not create-or-replace: a replace can only append columns at the
-- very end, and location_id needs to land before the computed `rank`
-- column - same constraint migration 0013 ran into). Nothing else depends
-- on this view, so dropping and recreating is safe.
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

-- Same "what does #1 cost right now" helper, now scoped per (category,
-- location) pair. Not currently called from the app (lib/db/listings.ts's
-- getCategoryPricing reimplements this in TS instead of using the RPC) but
-- kept in sync with the schema regardless.
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

  return v_current_top + 100;
end;
$$ language plpgsql stable;

-- click_events.category_id is denormalized from the listing at insert time
-- (migration 0008) purely so trending queries skip a join - location_id
-- gets the same treatment now that trending/latest-activity are scoped per
-- (category, location) too (see lib/db/activity.ts).
alter table click_events add column location_id uuid references locations (id) on delete cascade;

update click_events ce
set location_id = l.location_id
from listings l
where l.id = ce.listing_id and ce.location_id is null;

alter table click_events alter column location_id set not null;

drop index if exists click_events_category_created_idx;
create index click_events_category_location_created_idx on click_events (category_id, location_id, created_at desc);
