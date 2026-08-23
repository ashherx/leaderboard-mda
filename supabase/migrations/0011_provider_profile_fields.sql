-- Provider profile fields: location + licensed/insured are the two "must
-- have" fields going forward (enforced at the app layer, same as
-- provider_name/pitch - see lib/checkout.ts's validateListingContent).
-- years_in_business / availability / specialty_tags are optional enrichment,
-- nullable and never required by any check constraint.
--
-- Columns are added nullable (no NOT NULL/check-length constraint) even for
-- the "must have" ones, since existing rows have no value to backfill -
-- enforcement lives in the app so old rows don't break and can be edited
-- into compliance via the manage-page edit form.

alter table listings
  add column location          text,
  add column licensed_insured  boolean not null default false,
  add column years_in_business smallint check (years_in_business is null or years_in_business between 0 and 150),
  add column availability      text check (availability is null or availability in ('standard_hours', 'same_day', '24_7')),
  add column specialty_tags    text; -- simple comma-separated free text for now, not a taxonomy
