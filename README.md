# The Podium

By Million Dollar Agency. Pay-to-rank public leaderboard for service providers.
Visitors browse category-scoped leaderboards; a provider's rank within a category
is purely a function of how much they've paid. No accounts — a payment issues a
private "manage my listing" link, which is the only auth in the system.

## Status

**All 6 prompts from the original blueprint are done.** Foundation/data model, the public leaderboard
browsing experience, listing submission, and the manage-link page's edit +
re-bid flow — all verified against the real Supabase database with live
end-to-end tests (submit → outbid → correct final rank → edit content →
re-bid to reclaim a rank → cleanup).

**Payments are stubbed**, per an explicit call to skip Lemon Squeezy/Paddle
for now: submitting the form (initial or re-bid) takes a listing live
immediately instead of redirecting to checkout. The stub lives entirely
inside `lib/checkout.ts` (`runStubPaymentAndPublish`), clearly marked —
wiring up a real provider later means replacing that one function's body
with a checkout redirect and moving the `publishListing()` call into its
webhook handler; nothing else (validation, moderation, rank logic) needs to
change.

**Found and fixed during Prompt 4 testing**: Next.js patches the global
`fetch()` to cache by default, including inside third-party libraries like
supabase-js — `dynamic = "force-dynamic"` on a route does *not* exempt those
calls. Every Supabase read/write was at risk of serving a stale cached copy
(confirmed live: a re-bid updated the database correctly but the manage page
kept showing the old rank/bid). Fixed once, at the client level, in
`lib/supabase/server.ts` (`cache: "no-store"` on every request) rather than
patching each call site.

**Admin area (`/admin`)** is a single shared password (`ADMIN_PASSWORD` env
var), no per-user accounts, session cookie signed with HMAC
(`lib/admin-auth.ts`). Deliberately plain internal styling, not the public
brand system. Covers: filterable listings table (unpublish, toggle
Verified), category manager (add/rename/reorder/hide, with a live test
confirming a hidden category actually disappears from the public homepage),
and a revenue/status overview. Built with Next.js Server Actions
(progressive-enhancement forms) rather than client-fetch API routes, since
this is an internal tool with no need for the optimistic-UI patterns used on
the public-facing forms.

**Launch polish (Prompt 6)**: a `/rules` page (direct, short, no legalese);
a "Report this listing" link on every row storing to a `reports` table (no
moderation UI yet, by design — matches the blueprint's Phase 2 scope, but
the queue exists and is reviewable via the Supabase dashboard); a sitewide
"X here right now" visitor counter (a lightweight upserted-cookie table, no
websockets); per-category Open Graph share images rendered with the MDA
brand palette via `next/og`; and a mobile pass on the listing row and
manage-page layouts.

**Post-launch redesign**: there's no separate homepage grid of categories
anymore. The category leaderboard page — with a pill nav across the top to
switch between categories in one click — is the single canonical page type;
`/` just redirects to the first category by `display_order`. Rank stays
strictly per-category (never merged into one cross-category list): mixing
bids across categories would make "#1 in Marketing" read as "outranked by
anyone in any category who paid more," which undercuts the pitch to a niche
agency that isn't competing dollar-for-dollar with a bigger-budget category.
The pill nav is what makes that separation feel like a switch, not a wall.
Listing rows were also redesigned denser (divided list, price as a
gold-tiered pill for top 3) to match that reference look. All verified
live: `/` redirects to the first category and renders it correctly with the
pill nav highlighting the current one, the visitor counter incremented on a
real ping, an invalid report reason was rejected, the OG image renders as a
real PNG.

**outbid.lol-style hero, with two real (not fabricated) activity panels**:
- A stats pill (`components/StatsPill.tsx`): "N online" (15-minute window,
  same table as before) and "M visitors since launch" (a plain count — every
  row in `site_visits` is already one distinct visitor, since `session_id`
  is the primary key).
- The claim hero (`components/ClaimPanel.tsx`) is now "Claim #N for [−] $X
  [+]" with steppers, plus a quick-capture link input that prefills the full
  submission form's destination link (the form itself still collects
  name/pitch/link/bid together — unlike outbid's single-field flow, a
  "genuine service provider" listing needs more than a URL to be legible).
  Rank shown updates live: bids at or above the current #1 resolve to #1
  with no round trip (nothing can outrank them), anything lower debounces
  through the existing preview-rank endpoint.
- **Trending right now** and **Latest activity** are real, not relabeled
  totals: a new `click_events` table (timestamped, one row per click,
  alongside the existing running-total `click_count`) drives an honest
  "clicks in the last hour" trending panel; latest activity is derived from
  real completed `payments` rows. Verified live end-to-end: 4 real
  test clicks showed up as "4 clicks/h", a real submission showed up in
  Latest Activity as "at #4" with the correct elapsed time — then all test
  clicks/visits/listings were cleaned up and the one demo listing's
  `click_count` was restored to its original seeded value.

A handful of demo listings (`(Demo)` in the name) are seeded via
`supabase/migrations/0004_demo_listings.sql` purely to exercise ranking and
pagination — safe to delete once real listings exist:
`delete from listings where provider_name like '%(Demo)%';`

## Stack

- Next.js 14 (App Router) + TypeScript
- Postgres via Supabase
- Tailwind v4 with the `@theme` directive — MDA brand system (colors, fonts)
  lives in `app/globals.css`

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in your Supabase project's
   URL and keys (Project Settings → API in the Supabase dashboard).
2. Run the migrations in `supabase/migrations/` against your project, in order
   (via the Supabase SQL editor, or `supabase db push` if you have the CLI linked).
3. Set `ADMIN_PASSWORD` in `.env.local` to use `/admin` (a placeholder value
   is generated for local dev — change it before deploying anywhere real).
4. `npm install && npm run dev`

## Data model

Three tables, one derived view:

- **`categories`** — the fixed, curated leaderboard categories (name, slug,
  active/hidden, display order, per-category minimum bid).
- **`listings`** — a provider's listing: content (name, pitch, link, logo),
  `bid_amount_cents` (its current paid amount — the source of truth for rank),
  `status` (`pending_payment` → `published` / `unpublished`), and
  `manage_token_hash`.
- **`payments`** — an append-only audit trail of every charge attempt against a
  listing (initial bid, re-bids, failures, refunds), kept separate from the
  listing's current bid state.
- **`listing_ranks`** (view) — every `published` listing plus a `rank` column.

### How rank is calculated

A listing's rank is **not a stored column** — it's computed on read with a
window function, partitioned by category:

```sql
row_number() over (
  partition by category_id
  order by bid_amount_cents desc, claimed_at asc, id asc
)
```

Storing rank as a column would mean rewriting every lower-ranked row in a
category on each new bid (write amplification), and it's a value that can
silently go stale the moment a bid is added elsewhere in the same category.
Deriving it from `bid_amount_cents` at query time means there's exactly one
source of truth, and "recomputing ranks after a payment" is just re-reading
the view — nothing to explicitly trigger.

Ties (equal bid amounts) are broken by `claimed_at` (whoever claimed that
amount first holds the higher rank), then by `id` as a final deterministic
tiebreak.

A `category_top_price_cents()` SQL function answers "what does it cost to
claim #1 right now?" (current #1's bid + $1, or the category minimum if the
board is empty) without the app needing to duplicate that logic.

### Manage-link security

The raw manage-token is generated once (`lib/manage-token.ts`), handed to the
provider exactly once (in the URL / success screen). Only its SHA-256 hash
lives in `listings.manage_token_hash`, so a database leak can't be turned
into working manage-links — the same principle as password hashing. Lookup
hashes the incoming token and matches on the hash.

**Deliberate, explicitly-chosen exception**: `listings.manage_token_encrypted`
also stores a *reversibly* encrypted copy (AES-256-GCM, key in
`MANAGE_TOKEN_ENCRYPTION_KEY`), so admin can decrypt-and-copy a listing's
current live manage link (e.g. a provider asks support for it) without
resetting it — see "Get manage link" / "Copy current link" in `/admin/listings`.
This is strictly weaker than the hash: a database leak *plus* that env var
would recover every link, whereas the hash can never be reversed by anyone
under any circumstances. Listings issued before this column existed have no
decryptable copy until their token is next regenerated (there was never a
raw value available to encrypt retroactively) — the admin UI falls back to
"Get new link" (mint-and-invalidate) for those.

## Project layout

```
supabase/migrations/        SQL migrations, applied in order
lib/db/types.ts              Hand-written types mirroring the schema (Database, Category, Listing, Payment, ListingWithRank)
lib/db/categories.ts         Category queries
lib/db/listings.ts           Listing queries, rank preview, pricing, manage-token lookup
lib/db/payments.ts           Payment audit-trail queries
lib/supabase/server.ts       Server-only client (service role key — bypasses RLS)
lib/supabase/client.ts       Browser-safe client (anon key, reads only)
lib/manage-token.ts          Manage-token generation/hashing
lib/format.ts                $ and relative-time formatting helpers

app/page.tsx                          Redirects to the first category by display_order — no separate homepage
app/categories/[slug]/page.tsx        Category leaderboard (rank, pagination, claim CTA) — the canonical page type
app/api/categories/[slug]/preview-rank/route.ts  "What rank would $X claim?" for the bid-preview input
app/r/[id]/route.ts                   Click-through redirect (counts a click, then 302s to destination_link)

components/SiteHeader.tsx      Slim top bar (wordmark + Leaderboard/Rules) — added per public page, not the root layout
components/CategoryPillNav.tsx Switch between categories from any category page, current one highlighted
components/StatsPill.tsx       "N online · M visitors since launch"
components/TrendingPanel.tsx    Real "clicks in the last hour" per listing, from click_events
components/LatestActivityPanel.tsx  Recent claims/re-bids in this category, from completed payments
lib/db/activity.ts             click_events + trending/latest-activity queries

components/ListingRow.tsx            One leaderboard row — dense/divided-list style, gold price pill for top 3
components/ClaimPanel.tsx            "Claim #1 for $X" + custom-bid rank preview (client component)
components/Pagination.tsx            Prev/next page links
components/ListingSubmissionForm.tsx Submission form (client component) — posts to /api/listings

lib/checkout.ts        submitListingAndCheckout — validation + the stubbed-payment seam (see Status above)
lib/link-policy.ts     Rejects chat/invite links (Discord/Telegram/WhatsApp/Messenger) as a destination
lib/storage.ts         Logo upload to the `listing-logos` Supabase Storage bucket

app/categories/[slug]/claim/page.tsx  Submission form page
app/success/page.tsx                  Post-submission success page (rank + manage link), keyed by manage-token only
app/manage/[token]/page.tsx           Manage-link page — edit content, re-bid to reclaim a rank
app/api/listings/route.ts             Handles new-listing submission (multipart: fields + optional logo file)
app/api/manage/[token]/edit/route.ts  Content edit (no payment)
app/api/manage/[token]/rebid/route.ts Re-bid (stubbed payment, same seam as initial submission)

components/ManageEditForm.tsx  Edit-content form on the manage page
components/ManageRebidForm.tsx Re-bid form on the manage page, shows the new rank on success

lib/admin-auth.ts       Admin session cookie: sign/verify (HMAC), password check
lib/db/admin.ts         Admin-only queries: all listings (any status) + joins, category CRUD

app/admin/login/page.tsx                Password form
app/admin/(dashboard)/layout.tsx        Auth gate (redirects to login) + nav
app/admin/(dashboard)/page.tsx          Overview: revenue, counts
app/admin/(dashboard)/listings/page.tsx Filterable listings table — unpublish, toggle Verified, edit provider/category, manage-link tools
app/admin/(dashboard)/categories/page.tsx Category manager — add/rename/reorder/hide
app/admin/(dashboard)/actions.ts        Server Actions backing the admin forms above
app/api/admin/login/route.ts            Sets the signed session cookie
app/api/admin/logout/route.ts           Clears it
app/api/admin/listings/[id]/manage-link/route.ts  GET decrypts the current link; POST mints+invalidates a new one
components/admin/ManageLinkButton.tsx   "Copy current link" / "Get new link" — client component in the listings table

app/rules/page.tsx                Public rules page
app/categories/[slug]/opengraph-image.tsx  Per-category share image (MDA brand, next/og) — no separate homepage image, since / always redirects into a category
app/api/reports/route.ts          Stores a listing report
app/api/visit/route.ts            Upserts the cookie-based visitor ping

lib/db/reports.ts       createReport (validated reason list)
lib/db/site-visits.ts   recordVisit / countRecentVisitors (15-minute window)

components/ReportListingLink.tsx  Inline report form on each leaderboard row
components/VisitTracker.tsx       Fires the visitor ping once per page load (client, renders nothing)
components/Footer.tsx             Shared footer (Rules link) — added per public page, not the root layout, so /admin stays untouched
```

## Getting Started (Next.js default)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.
