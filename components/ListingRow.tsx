import { formatCentsAsDollars, formatTimeSince } from "@/lib/format";
import type { ListingWithRank } from "@/lib/db/types";
// "Report this listing" is turned off for now — see the commented-out usage below.
// import { ReportListingLink } from "@/components/ReportListingLink";

// Opacity steps down by rank, but stays high enough (80/60%) that white text
// keeps working — a lighter tint (like the old /15-/30 range) would leave
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

export function ListingRow({ listing }: { listing: ListingWithRank }) {
  const isTopThree = listing.rank <= 3;

  return (
    <li className="relative overflow-hidden px-4 py-4 transition-colors hover:bg-canvas">
      {isTopThree && (
        // Right triangle overlaying the card's actual top-left corner — flush
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

      <a href={`/r/${listing.id}`} className={`flex items-start gap-4 ${isTopThree ? "pl-14" : ""}`}>
        {!isTopThree && (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-canvas font-mono text-base font-bold text-slate">
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
            className="h-14 w-14 shrink-0 rounded-full bg-canvas object-contain p-2"
          />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-canvas font-display text-lg text-slate">
            {listing.provider_name.charAt(0).toUpperCase()}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-display text-base font-bold text-ink">{listing.provider_name}</span>
            {listing.is_verified && (
              <span className="shrink-0 rounded-full bg-green/8 px-1.5 py-0.5 text-[10px] font-medium text-green">
                Verified
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-slate">{listing.pitch}</p>
          <p className="mt-1.5 text-xs text-slate">
            {formatTimeSince(listing.claimed_at)} <span className="text-green">●</span>{" "}
            <span className="font-semibold text-ink">{listing.click_count.toLocaleString()} clicks</span>
          </p>
        </div>

        <span
          className={`shrink-0 font-mono text-xl font-bold ${isTopThree ? PRICE_TEXT_STYLES[listing.rank] : "text-ink"}`}
        >
          {formatCentsAsDollars(listing.bid_amount_cents)}
        </span>
      </a>

      {/* "Report this listing" is turned off for now — component/API/table
          are all still intact, just not rendered. Re-add the div below to
          bring it back:
      <div className={`mt-2 ${isTopThree ? "ml-14" : "ml-18"}`}>
        <ReportListingLink listingId={listing.id} />
      </div>
      */}
    </li>
  );
}
