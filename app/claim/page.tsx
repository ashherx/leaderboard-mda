import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { getCategoryBySlug } from "@/lib/db/categories";
import { getStateBySlug } from "@/lib/db/locations";
import { getCategoryPricing } from "@/lib/db/listings";
import { ListingSubmissionForm } from "@/components/ListingSubmissionForm";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";
import { SiteHeader } from "@/components/SiteHeader";
import { LemonSqueezyScript } from "@/components/LemonSqueezyScript";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Claim a Sponsored Leaderboard Position | The Podium" },
  description: "Submit your service provider listing and choose the paid bid that determines its leaderboard rank.",
  robots: { index: false, follow: true },
  referrer: "no-referrer",
};

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: { state?: string; category?: string; amount?: string; link?: string };
}) {
  const state = searchParams.state ? await getStateBySlug(searchParams.state) : null;
  if (!state) notFound();

  const category = searchParams.category ? await getCategoryBySlug(searchParams.category) : null;
  if (!category) notFound();

  const pricing = await getCategoryPricing(category.id, state.id, category.min_bid_cents);
  const requestedAmount = Number(searchParams.amount);
  const initialBidDollars =
    Number.isInteger(requestedAmount) && requestedAmount * 100 >= category.min_bid_cents
      ? requestedAmount
      : pricing.claimFirstPriceCents / 100;

  // From the hero's quick-capture input, if the visitor filled it in there -
  // just a convenience prefill, still fully editable on this form.
  const initialDestinationLink = searchParams.link ?? "";

  return (
    <>
      <VisitTracker />
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-10">
        <Link
          href={`/${state.slug}/${category.slug}`}
          className="inline-flex items-center gap-1 text-sm text-slate hover:text-green"
        >
          <ArrowLeft weight="duotone" className="h-3.5 w-3.5" />
          Back to {category.name}
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">Claim your spot</h1>
        <p className="mt-1 text-slate">
          Listing in <strong>{category.name}</strong> ({state.name}). Submitting opens a secure checkout - your
          listing goes live as soon as payment completes.
        </p>

        <div className="mt-6">
          <ListingSubmissionForm
            categorySlug={category.slug}
            stateSlug={state.slug}
            minBidDollars={category.min_bid_cents / 100}
            initialBidDollars={initialBidDollars}
            initialDestinationLink={initialDestinationLink}
          />
        </div>
      </main>
      <Footer />
      <LemonSqueezyScript />
    </>
  );
}
