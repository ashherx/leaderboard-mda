-- Reversible copy of the manage-token, alongside the existing one-way hash
-- (manage_token_hash), so an admin can decrypt-and-copy a listing's current
-- live manage link without resetting it. This is a deliberate, explicitly
-- chosen tradeoff: manage_token_hash can never be reversed even with full
-- server access, while this column can be — by anyone holding both the
-- database and MANAGE_TOKEN_ENCRYPTION_KEY (an env var, not a DB secret).
-- Existing listings (issued before this column existed) have no encrypted
-- value until their token is next regenerated — there's no way to backfill
-- one, since the raw token was never available to encrypt.
alter table listings add column manage_token_encrypted text;
