-- Optional pricing signals, same whole-dollar-cents convention as
-- listings.bid_amount_cents. Both nullable and never required - a per-job
-- trade may have no meaningful hourly rate, and plenty of providers won't
-- want to commit to a public minimum. "starting_hourly_rate" (not
-- "hourly_rate") deliberately signals this is directional, not a locked quote.

alter table listings
  add column starting_hourly_rate_cents integer
    check (starting_hourly_rate_cents is null or (starting_hourly_rate_cents > 0 and starting_hourly_rate_cents % 100 = 0)),
  add column min_project_cents integer
    check (min_project_cents is null or (min_project_cents > 0 and min_project_cents % 100 = 0));
