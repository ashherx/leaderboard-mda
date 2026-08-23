import { formatCentsAsDollars, formatTimeSince } from "@/lib/format";
import type { ListingWithRank } from "@/lib/db/types";
import { ListingInfoPill } from "@/components/ListingInfoPill";
import { ListingOutboundLink } from "@/components/ListingOutboundLink";
// "Report this listing" is turned off for now - see the commented-out usage below.
// import { ReportListingLink } from "@/components/ReportListingLink";

// Opacity steps down by rank, but stays high enough (80/60%) that white text
// keeps working - a lighter tint (like the old /15-/30 range) would leave
// white unreadable against a near-canvas background.
const RANK_BADGE_STYLES: Record<number, string> = {
  1: "bg-gold text-white",
  2: "bg-gold/80 text-white",
  3: "bg-gold/60 text-white",
};

const PRICE_TEXT_STYLES: Record<number, string> = {
  1: "text-gold",
  2: "text-gold/80",
  3: "text-gold/60",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  standard_hours: "Standard hours",
  same_day: "Same-day",
  "24_7": "24/7 emergency",
};

export function ListingRow({
  listing,
  categoryName,
}: {
  listing: ListingWithRank;
  /** Shown only on the "All" merged feed (see LeaderboardBrowser) - a single-category board doesn't need to repeat its own name on every row. */
  categoryName?: string;
}) {
  const isTopThree = listing.rank <= 3;

  return (
    <li className="relative overflow-hidden px-4 py-4 transition-colors hover:bg-canvas">
      {isTopThree && (
        // Right triangle overlaying the card's actual top-left corner - flush
        // against the edges (no inset), right angle at 0,0, hypotenuse
        // running to the bottom-right. Absolutely positioned, out of flow,
        // so it doesn't compete with the row's own padding.
        <span
          className={`absolute left-0 top-0 flex h-20 w-20 font-mono text-base font-bold ${RANK_BADGE_STYLES[listing.rank]}`}
          style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        >
          <span className="pl-2 pt-1.5">#{listing.rank}</span>
        </span>
      )}

      <ListingOutboundLink
        listingId={listing.id}
        destinationLink={listing.destination_link}
        className={`flex items-start gap-4 ${isTopThree ? "pl-14" : ""}`}
      >
        {!isTopThree && (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-canvas font-mono text-base font-bold text-slate">
            #{listing.rank}
          </span>
        )}

        {listing.logo_url ? (
          // object-contain (not cover) + a padded canvas backing, so a
          // non-square logo (e.g. a wide wordmark-style mark) doesn't get
          // cropped to fill the circle.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.logo_url}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full border border-border bg-canvas object-contain p-2"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-canvas font-display text-xl text-slate">
            {listing.provider_name.charAt(0).toUpperCase()}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            {/* min-w-0 is load-bearing here, not decorative: a flex item's
                default min-width is its content's natural (unwrapped)
                width, which overrides line-clamp/overflow entirely - without
                it a long, unbroken business name (e.g. an SEO-title-style
                name pulled in from url-metadata prefill) stretches the row
                instead of wrapping/clamping, which is what was pushing the
                price out of alignment on narrow screens. */}
            <span className="min-w-0 flex-1 line-clamp-2 font-display text-base font-bold text-ink">
              {listing.provider_name}
            </span>
            {listing.is_verified && (
              <span className="shrink-0 rounded-full bg-green/8 px-1.5 py-0.5 text-[10px] font-medium text-green">
                Verified
              </span>
            )}
            {categoryName && (
              <span className="shrink-0 rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-slate">
                {categoryName}
              </span>
            )}
          </div>
          {listing.pitch && <p className="mt-0.5 line-clamp-2 text-sm text-slate">{listing.pitch}</p>}

          {(listing.location ||
            listing.licensed_insured ||
            listing.availability ||
            listing.starting_hourly_rate_cents ||
            listing.min_project_cents) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate">
              {listing.location && (
                <span className="font-bold">{listing.location}</span>
              )}

              {listing.starting_hourly_rate_cents && (
                <span className="rounded-full bg-canvas px-1.5 py-0.5 font-medium text-ink">
                  From{" "}
                  {formatCentsAsDollars(listing.starting_hourly_rate_cents)}/hr
                </span>
              )}
              {listing.min_project_cents && (
                <span className="rounded-full bg-canvas px-1.5 py-0.5 font-medium text-ink">
                  {formatCentsAsDollars(listing.min_project_cents)} min project
                </span>
              )}
            </div>
          )}

          <p className="mt-1.5 text-xs text-slate">
            {formatTimeSince(listing.claimed_at)}{" "}
            <span className="ml-2 text-green">●</span>{" "}
            <span className="font-semibold text-ink">
              {listing.click_count.toLocaleString()} clicks
            </span>
          </p>
        </div>

        <span
          className={`shrink-0 font-mono text-xl font-bold ${isTopThree ? PRICE_TEXT_STYLES[listing.rank] : "text-ink"}`}
        >
          {formatCentsAsDollars(listing.bid_amount_cents)}
        </span>
      </ListingOutboundLink>

      {/* Sibling of the outbound link above, never nested inside it - see
          ListingInfoPill's own comment for why. Sits at the row's own
          bottom-right corner (the row is `relative`), clear of the price
          which lives at the top of the <a>'s flex row. */}
      <ListingInfoPill listing={listing} />

      {/* "Report this listing" is turned off for now - component/API/table
          are all still intact, just not rendered. Re-add the div below to
          bring it back:
      <div className={`mt-2 ${isTopThree ? "ml-14" : "ml-18"}`}>
        <ReportListingLink listingId={listing.id} />
      </div>
      */}
    </li>
  );
}
