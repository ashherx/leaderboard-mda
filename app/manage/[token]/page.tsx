import Link from "next/link";
import { getCategoryById } from "@/lib/db/categories";
import { getCategoryPricing, getListingByManageToken, getListingRank } from "@/lib/db/listings";
import { formatCentsAsDollars, formatTimeSince } from "@/lib/format";
import { ManageEditForm } from "@/components/ManageEditForm";
import { ManageRebidForm } from "@/components/ManageRebidForm";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function ManageListingPage({ params }: { params: { token: string } }) {
  const listing = await getListingByManageToken(params.token);

  // Deliberately generic: an invalid/guessed token looks identical to any
  // other invalid token, so this page can't be used to enumerate listings.
  if (!listing) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-display text-xl font-semibold text-ink">Link not found</p>
        <p className="mt-2 text-slate">
          This manage-listing link is invalid or has expired. If you saved it from your success page, double-check
          you copied the whole thing.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm text-green hover:underline">
          ← Back to the leaderboard
        </Link>
      </main>
    );
  }

  const category = await getCategoryById(listing.category_id);
  const [rank, pricing] = await Promise.all([
    getListingRank(listing.id),
    category ? getCategoryPricing(category.id, category.min_bid_cents) : null,
  ]);

  return (
    <>
    <main className="mx-auto max-w-lg px-4 py-10">
      <p className="text-sm text-slate">Manage your listing</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink">{listing.provider_name}</h1>
      <p className="mt-1 text-slate">{listing.pitch}</p>

      <dl className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-border bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate">Category</dt>
          <dd className="font-medium text-ink">{category?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate">Current rank</dt>
          <dd className="font-mono font-semibold text-ink">
            {listing.status === "published" && rank !== null ? `#${rank}` : "Not live"}
          </dd>
        </div>
        <div>
          <dt className="text-slate">Current bid</dt>
          <dd className="font-mono font-medium text-ink">{formatCentsAsDollars(listing.bid_amount_cents)}</dd>
        </div>
        <div>
          <dt className="text-slate">Clicks</dt>
          <dd className="font-mono font-medium text-ink">{listing.click_count.toLocaleString()}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate">Claimed</dt>
          <dd className="font-medium text-ink">{formatTimeSince(listing.claimed_at)}</dd>
        </div>
      </dl>

      {category && pricing && (
        <div className="mt-6">
          <ManageRebidForm
            token={params.token}
            minBidDollars={category.min_bid_cents / 100}
            claimFirstPriceCents={pricing.claimFirstPriceCents}
            currentBidDollars={listing.bid_amount_cents / 100}
          />
        </div>
      )}

      <div className="mt-6">
        <ManageEditForm
          token={params.token}
          initialProviderName={listing.provider_name}
          initialPitch={listing.pitch}
          initialDestinationLink={listing.destination_link}
        />
      </div>

      {category && (
        <Link href={`/categories/${category.slug}`} className="mt-6 inline-block text-sm text-green hover:underline">
          ← View the {category.name} leaderboard
        </Link>
      )}
    </main>
    <Footer />
    </>
  );
}
