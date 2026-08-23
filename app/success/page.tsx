import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getListingByManageToken, getListingById, getListingRank } from "@/lib/db/listings";
import { getCategoryById } from "@/lib/db/categories";
import { getPaymentById } from "@/lib/db/payments";
import { formatCentsAsDollars } from "@/lib/format";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { PendingPaymentNotice } from "@/components/PendingPaymentNotice";
import type { Listing, Payment } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: { token?: string; payment?: string } }) {
  const { token, payment: paymentId } = searchParams;

  // Two ways to land here: the normal flow (own listing, has a manage
  // token), or a checkout that turned into a top-up of someone else's
  // existing listing for a duplicate URL - no manage token to show in that
  // case, only a payment id to resolve the listing through (see
  // submitListingAndCheckout's duplicate-URL branch).
  let listing: Listing | null = null;
  let watchedPayment: Payment | null = null;

  if (token) {
    listing = await getListingByManageToken(token);
    watchedPayment = paymentId ? await getPaymentById(paymentId) : null;
  } else if (paymentId) {
    watchedPayment = await getPaymentById(paymentId);
    listing = watchedPayment ? await getListingById(watchedPayment.listing_id) : null;
  }

  if (!listing) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="font-display text-xl font-semibold text-ink">Nothing to show here</p>
          <p className="mt-2 text-slate">This link is missing or invalid.</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-1 text-sm text-green hover:underline">
            <ArrowLeft weight="duotone" className="h-3.5 w-3.5" />
            Back to the leaderboard
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const [category, rank] = await Promise.all([getCategoryById(listing.category_id), getListingRank(listing.id)]);

  // On a re-bid (or a duplicate-URL top-up) the listing is already
  // published - status alone can't tell this specific checkout apart from
  // the rank it had before it. Watching the actual payment id (when we have
  // one) is what makes this accurate instead of showing the pre-checkout
  // rank as if it were final.
  const isLive = paymentId ? watchedPayment?.status === "completed" : listing.status === "published";

  const headersList = headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const manageUrl = token ? `${protocol}://${host}/manage/${token}` : null;

  return (
    <>
    <SiteHeader />
    <main className="mx-auto max-w-lg px-4 py-16">
      {isLive ? (
        <div className="rounded-xl border border-green bg-green/8 p-6 text-center">
          <p className="text-sm font-medium text-green">You&apos;re live</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">
            #{rank} in {category?.name ?? "your category"}
          </p>
          <p className="mt-1 text-slate">
            {listing.provider_name} · {formatCentsAsDollars(listing.bid_amount_cents)}
          </p>
        </div>
      ) : (
        paymentId && <PendingPaymentNotice token={token} payment={paymentId} />
      )}

      {manageUrl ? (
        <div className="mt-6 rounded-xl border border-gold bg-gold/8 p-5">
          <p className="font-display font-semibold text-ink">Save this link - it's the only way back in</p>
          <p className="mt-1 text-sm text-slate">
            There are no accounts. This private link is the only way to edit your listing or re-bid to reclaim a
            better rank later. If you lose it, it can&apos;t be recovered.
          </p>
          <div className="mt-3 break-all rounded-md border border-border bg-white px-3 py-2 font-mono text-sm text-ink">
            {manageUrl}
          </div>
          <a
            href={manageUrl}
            className="mt-3 inline-flex items-center gap-1 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-green"
          >
            Manage my listing
            <ArrowRight weight="duotone" className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : (
        // Duplicate-URL top-up: this listing already belongs to whoever
        // submitted it originally - no manage link to hand out here, see
        // submitListingAndCheckout.
        <p className="mt-6 text-sm text-slate">
          This link was already listed - your payment topped up its existing rank rather than creating a new
          listing, so there's no separate manage link for it.
        </p>
      )}

      {category && (
        <Link href={`/?category=${category.slug}`} className="mt-6 inline-flex items-center gap-1 text-sm text-green hover:underline">
          <ArrowLeft weight="duotone" className="h-3.5 w-3.5" />
          View the {category.name} leaderboard
        </Link>
      )}
    </main>
    <Footer />
    </>
  );
}
