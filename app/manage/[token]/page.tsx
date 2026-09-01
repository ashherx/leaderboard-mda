import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { getCategoryById } from "@/lib/db/categories";
import { getStateById } from "@/lib/db/locations";
import { getCategoryPricing, getListingByManageToken, getListingRank } from "@/lib/db/listings";
import { listPaymentsForListing } from "@/lib/db/payments";
import { formatCentsAsDollars, formatTimeSince } from "@/lib/format";
import { ManageEditForm } from "@/components/ManageEditForm";
import { ManageRebidForm } from "@/components/ManageRebidForm";
import { PaymentHistory } from "@/components/PaymentHistory";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { LemonSqueezyScript } from "@/components/LemonSqueezyScript";

export const dynamic = "force-dynamic";

export default async function ManageListingPage({ params }: { params: { token: string } }) {
  const listing = await getListingByManageToken(params.token);

  // Deliberately generic: an invalid/guessed token looks identical to any
  // other invalid token, so this page can't be used to enumerate listings.
  if (!listing) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="font-display text-xl font-semibold text-ink">Link not found</p>
          <p className="mt-2 text-slate">
            This manage-listing link is invalid or has expired. If you saved it from your success page, double-check
            you copied the whole thing.
          </p>
          <Link href="/" className="mt-6 inline-flex items-center gap-1 text-sm text-green hover:underline">
            <ArrowLeft weight="duotone" className="h-3.5 w-3.5" />
            Back to the leaderboard
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const [category, state] = await Promise.all([
    getCategoryById(listing.category_id),
    getStateById(listing.location_id),
  ]);
  const [rank, pricing, payments] = await Promise.all([
    getListingRank(listing.id),
    category && state ? getCategoryPricing(category.id, state.id, category.min_bid_cents) : null,
    listPaymentsForListing(listing.id),
  ]);

  // listing.claimed_at only ever records the *first* time this listing went
  // live - it deliberately never moves on a re-bid (it's also the rank
  // tie-break: whoever's held a given bid amount longest wins ties). The
  // "Claimed" field here is about the current standing, though, so it reads
  // off the most recent completed payment instead - payments is already
  // newest-first.
  const lastClaimedAt = payments.find((payment) => payment.status === "completed")?.completed_at ?? listing.claimed_at;

  return (
    <>
    <SiteHeader />
    <main className="mx-auto max-w-lg px-4 py-10">
      <p className="text-sm text-slate">Manage your listing</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink">{listing.provider_name}</h1>
      <p className="mt-1 text-slate">{listing.pitch}</p>

      <dl className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-border bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate">Category</dt>
          <dd className="font-medium text-ink">{category?.name ?? "-"}</dd>
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
          <dd className="font-medium text-ink">{formatTimeSince(lastClaimedAt)}</dd>
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
          initialPitch={listing.pitch ?? ""}
          initialDestinationLink={listing.destination_link}
          initialLocation={listing.location ?? ""}
          initialLicensedInsured={listing.licensed_insured}
          initialYearsInBusiness={listing.years_in_business}
          initialAvailability={listing.availability}
          initialSpecialtyTags={listing.specialty_tags ?? ""}
          initialStartingHourlyRateDollars={
            listing.starting_hourly_rate_cents !== null ? listing.starting_hourly_rate_cents / 100 : null
          }
          initialMinProjectDollars={listing.min_project_cents !== null ? listing.min_project_cents / 100 : null}
        />
      </div>

      <PaymentHistory payments={payments} />

      {category && state && (
        <Link
          href={`/${state.slug}/${category.slug}`}
          className="mt-6 inline-flex items-center gap-1 text-sm text-green hover:underline"
        >
          <ArrowLeft weight="duotone" className="h-3.5 w-3.5" />
          View the {category.name} leaderboard
        </Link>
      )}
    </main>
    <Footer />
    <LemonSqueezyScript />
    </>
  );
}
