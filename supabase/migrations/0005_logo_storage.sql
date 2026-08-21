-- Public bucket for listing logos, uploaded at submission time.
insert into storage.buckets (id, name, public)
values ('listing-logos', 'listing-logos', true)
on conflict (id) do nothing;

-- Anyone can read (logos are public assets shown on the leaderboard).
create policy "listing_logos_public_read"
  on storage.objects for select
  using (bucket_id = 'listing-logos');

-- Uploads only ever happen server-side (service role), which bypasses RLS
-- entirely, so no insert/update policy is needed for anon/authenticated.
