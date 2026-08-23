-- "Licensed & insured?" is no longer a forced yes/no (see
-- lib/checkout.ts/components/ListingSubmissionForm.tsx) - a provider can now
-- leave it unanswered rather than being made to pick one. That's a genuine
-- third state, not just "no", so the column needs to actually hold NULL
-- rather than defaulting unanswered rows to false.
alter table listings
  alter column licensed_insured drop not null,
  alter column licensed_insured drop default;
