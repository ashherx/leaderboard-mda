import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { getCategoryBySlug } from "@/lib/db/categories";
import { getDefaultActiveState, getStateBySlug } from "@/lib/db/locations";
import { getCategoryPricing } from "@/lib/db/listings";
import { ListingSubmissionForm } from "@/components/ListingSubmissionForm";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: { category?: string; state?: string; amount?: string; link?: string };
}) {
  const category = searchParams.category ? await getCategoryBySlug(searchParams.category) : null;
  if (!category) notFound();

  // `state` is missing on legacy /claim?category=... links (predating
  // states) - fall back to the default active one rather than 404ing an
  // already-shared/indexed link.
  const state = searchParams.state ? await getStateBySlug(searchParams.state) : await getDefaultActiveState();
  if (!state) notFound();

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
          href={`/${state.slug}?category=${category.slug}`}
          className="inline-flex items-center gap-1 text-sm text-slate hover:text-green"
        >
          <ArrowLeft weight="duotone" className="h-3.5 w-3.5" />
          Back to {category.name}
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">Claim your spot</h1>
        <p className="mt-1 text-slate">
          Listing in <strong>{category.name}</strong>, <strong>{state.name}</strong>. Submitting opens a secure
          checkout - your listing goes live as soon as payment completes.
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
    </>
  );
}
