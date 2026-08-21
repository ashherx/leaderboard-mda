-- Agency Bid Leaderboard — initial schema
-- Money is stored as integer cents throughout (bids are whole-dollar, so always
-- a multiple of 100) to avoid floating point drift; display layer converts to $.

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,                                   -- short blurb shown on homepage
  is_active     boolean not null default true,           -- hidden categories stay queryable for admin, hidden from public
  display_order integer not null default 0,
  min_bid_cents integer not null default 500 check (min_bid_cents > 0 and min_bid_cents % 100 = 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index categories_active_order_idx on categories (is_active, display_order);

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------
create type listing_status as enum ('pending_payment', 'published', 'unpublished');

create table listings (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid not null references categories (id) on delete restrict,

  provider_name     text not null check (char_length(provider_name) between 1 and 80),
  pitch             text not null check (char_length(pitch) between 1 and 140),
  destination_link  text not null,
  logo_url          text,

  bid_amount_cents  integer not null check (bid_amount_cents > 0 and bid_amount_cents % 100 = 0),
  status            listing_status not null default 'pending_payment',

  -- Manage-link auth: the raw token is generated once, shown to the provider,
  -- and never stored. Only its SHA-256 hash lives here, so a DB read/dump
  -- can't be turned into working manage-links (same principle as password hashing).
  manage_token_hash text not null unique,

  is_verified       boolean not null default false,
  click_count       integer not null default 0,

  claimed_at        timestamptz,                          -- set when the listing first goes live (payment completes)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index listings_category_status_rank_idx
  on listings (category_id, status, bid_amount_cents desc, claimed_at asc);

create index listings_manage_token_hash_idx on listings (manage_token_hash);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create type payment_status as enum ('pending', 'completed', 'failed', 'refunded');

create table payments (
  id                  uuid primary key default gen_random_uuid(),
  listing_id          uuid not null references listings (id) on delete cascade,

  amount_cents        integer not null check (amount_cents > 0 and amount_cents % 100 = 0),
  provider             text not null default 'manual',     -- 'lemon_squeezy' | 'paddle' | 'manual' (kept as text, not enum, so a provider swap needs no migration)
  provider_payment_id  text,                                -- checkout/order id from the payment provider, once known
  status               payment_status not null default 'pending',

  created_at          timestamptz not null default now(),
  completed_at        timestamptz
);

create index payments_listing_id_idx on payments (listing_id);
create unique index payments_provider_payment_id_idx
  on payments (provider, provider_payment_id)
  where provider_payment_id is not null;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger categories_set_updated_at
  before update on categories
  for each row execute function set_updated_at();

create trigger listings_set_updated_at
  before update on listings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- rank derivation
-- ---------------------------------------------------------------------------
-- Rank is NEVER stored on the listing row. It's a position within a category's
-- *published* listings, purely a function of bid_amount_cents, so storing it
-- would mean rewriting every lower-ranked row on each new bid — a write
-- amplification bug waiting to happen, and a value that can silently go stale.
-- Instead it's computed on read via ROW_NUMBER() here. Ties (equal bids) are
-- broken by claimed_at (first to claim that amount holds the higher rank),
-- then by id as a final deterministic tiebreak.
create view listing_ranks as
select
  l.*,
  row_number() over (
    partition by l.category_id
    order by l.bid_amount_cents desc, l.claimed_at asc, l.id asc
  ) as rank
from listings l
where l.status = 'published';

-- ---------------------------------------------------------------------------
-- pricing helper: what does it cost to claim #1 right now, in this category?
-- ---------------------------------------------------------------------------
create or replace function category_top_price_cents(p_category_id uuid)
returns integer as $$
declare
  v_current_top integer;
  v_min_bid integer;
begin
  select min_bid_cents into v_min_bid from categories where id = p_category_id;

  select bid_amount_cents into v_current_top
  from listings
  where category_id = p_category_id and status = 'published'
  order by bid_amount_cents desc, claimed_at asc, id asc
  limit 1;

  if v_current_top is null then
    return v_min_bid; -- board is empty: minimum bid claims #1
  end if;

  return v_current_top + 100; -- one dollar more than the current #1
end;
$$ language plpgsql stable;
