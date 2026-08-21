import { formatCentsAsDollars, formatTimeSince } from "@/lib/format";
import type { ListingWithRank } from "@/lib/db/types";
import { ReportListingLink } from "@/components/ReportListingLink";

const TOP_RANK_STYLES: Record<number, string> = {
  1: "border-gold bg-gold/12",
  2: "border-gold/60 bg-gold/8",
  3: "border-gold/40 bg-gold/8",
};

const RANK_BADGE_STYLES: Record<number, string> = {
  1: "bg-gold text-ink",
  2: "bg-gold/30 text-ink",
  3: "bg-gold/15 text-ink",
};

export function ListingRow({ listing }: { listing: ListingWithRank }) {
  const isTopThree = listing.rank <= 3;

  return (
    <li
      className={`flex flex-wrap items-center gap-4 rounded-lg border p-4 transition-colors ${
        isTopThree ? TOP_RANK_STYLES[listing.rank] : "border-border bg-white"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold ${
          isTopThree ? RANK_BADGE_STYLES[listing.rank] : "bg-canvas text-slate"
        }`}
      >
        {listing.rank}
      </span>

      {listing.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={listing.logo_url}
          alt=""
          className="h-10 w-10 shrink-0 rounded-md border border-border object-cover"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-canvas font-display text-sm text-slate">
          {listing.provider_name.charAt(0).toUpperCase()}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-display font-semibold text-ink">{listing.provider_name}</span>
          {listing.is_verified && (
            <span className="rounded-full bg-green/8 px-2 py-0.5 text-xs font-medium text-green">Verified</span>
          )}
        </div>
        <p className="truncate text-sm text-slate">{listing.pitch}</p>
        <p className="mt-0.5 text-xs text-slate">
          Claimed {formatTimeSince(listing.claimed_at)} · {listing.click_count.toLocaleString()} clicks
        </p>
      </div>

      <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end">
        <span className="font-mono text-sm font-semibold text-ink">{formatCentsAsDollars(listing.bid_amount_cents)}</span>
        <a
          href={`/r/${listing.id}`}
          className="rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-green hover:text-green"
        >
          Visit ↗
        </a>
      </div>

      <div className="w-full">
        <ReportListingLink listingId={listing.id} />
      </div>
    </li>
  );
}
