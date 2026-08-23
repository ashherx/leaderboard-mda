-- Pitch is no longer a required field (see lib/checkout.ts's
-- validateListingContent) - only drop NOT NULL here, the existing length
-- check constraint (`char_length(pitch) between 1 and 140`) doesn't need to
-- change: a CHECK constraint is automatically satisfied when the column
-- value is NULL (SQL's three-valued logic - char_length(NULL) is NULL, and
-- `NULL between 1 and 140` is unknown, which a CHECK treats as a pass), so
-- it already permits null while still capping non-null pitches at 140 chars
-- and rejecting an empty string (which the app never sends anyway - see
-- validateListingContent, which stores "" as null rather than "").
alter table listings alter column pitch drop not null;
