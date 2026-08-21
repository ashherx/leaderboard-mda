-- Atomic click counter bump, so concurrent clicks on a hot listing can't
-- race each other via a read-then-write from the app layer.
create or replace function increment_listing_click_count(p_listing_id uuid)
returns void as $$
begin
  update listings set click_count = click_count + 1 where id = p_listing_id;
end;
$$ language plpgsql;
