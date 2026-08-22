-- DEMO DATA - for visually verifying ranking/pagination/display during
-- Prompt 2 development only. Every row here is clearly fake ("(Demo)" in the
-- name) and safe to delete once the admin panel (Prompt 5) exists, or via:
--   delete from listings where provider_name like '%(Demo)%';
-- manage_token_hash is a random hash with no real corresponding token, since
-- these listings were never actually claimed through the payment flow.

-- design-branding: a handful of listings to check #1/#2/#3 styling.
insert into listings (category_id, provider_name, pitch, destination_link, bid_amount_cents, status, manage_token_hash, is_verified, click_count, claimed_at)
select id, 'Studio North (Demo)', 'Brand identity for funded startups.', 'https://example.com/studio-north', 4200, 'published'::listing_status, encode(gen_random_bytes(32), 'hex'), true, 214, now() - interval '3 hours'
from categories where slug = 'design-branding'
union all
select id, 'Halftone Collective (Demo)', 'Packaging and brand design that sells shelf space.', 'https://example.com/halftone', 3100, 'published'::listing_status, encode(gen_random_bytes(32), 'hex'), false, 98, now() - interval '1 day'
from categories where slug = 'design-branding'
union all
select id, 'Ledger & Ink (Demo)', 'Visual identity for fintech and B2B SaaS.', 'https://example.com/ledger-ink', 2500, 'published'::listing_status, encode(gen_random_bytes(32), 'hex'), false, 40, now() - interval '4 days'
from categories where slug = 'design-branding';

-- marketing-growth: a few more, mid-pack.
insert into listings (category_id, provider_name, pitch, destination_link, bid_amount_cents, status, manage_token_hash, is_verified, click_count, claimed_at)
select id, 'Growloop (Demo)', 'Paid acquisition for DTC brands.', 'https://example.com/growloop', 6600, 'published'::listing_status, encode(gen_random_bytes(32), 'hex'), true, 512, now() - interval '6 hours'
from categories where slug = 'marketing-growth'
union all
select id, 'Signal Growth (Demo)', 'Full-funnel growth marketing for B2B.', 'https://example.com/signal-growth', 5100, 'published'::listing_status, encode(gen_random_bytes(32), 'hex'), false, 187, now() - interval '2 days'
from categories where slug = 'marketing-growth'
union all
select id, 'Northbound Media (Demo)', 'Performance marketing, no vanity metrics.', 'https://example.com/northbound', 1900, 'published'::listing_status, encode(gen_random_bytes(32), 'hex'), false, 22, now() - interval '10 days'
from categories where slug = 'marketing-growth'
union all
select id, 'Wick & Co Growth (Demo)', 'Growth marketing for early-stage founders.', 'https://example.com/wick-co', 500, 'published'::listing_status, encode(gen_random_bytes(32), 'hex'), false, 3, now() - interval '20 days'
from categories where slug = 'marketing-growth';

-- ai-automation: bulk-generated so the leaderboard has enough rows to
-- exercise pagination (default page size is 25).
insert into listings (category_id, provider_name, pitch, destination_link, bid_amount_cents, status, manage_token_hash, is_verified, click_count, claimed_at)
select
  c.id,
  'Automation Shop #' || s.n || ' (Demo)',
  'AI workflow automation for ops-heavy teams.',
  'https://example.com/automation-shop-' || s.n,
  greatest(500, 3200 - s.n * 100),                    -- descending bids, $32 down to $5 floor
  'published'::listing_status,
  encode(gen_random_bytes(32), 'hex'),
  (s.n % 7 = 0),
  (300 - s.n * 8),
  now() - (s.n || ' hours')::interval
from categories c, generate_series(1, 28) as s(n)
where c.slug = 'ai-automation';
