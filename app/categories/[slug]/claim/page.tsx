import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/db/categories";
import { getCategoryPricing } from "@/lib/db/listings";
import { ListingSubmissionForm } from "@/components/ListingSubmissionForm";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";

export const dynamic = "force-dynamic";

export default async function ClaimPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { amount?: string };
}) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const pricing = await getCategoryPricing(category.id, category.min_bid_cents);
  const requestedAmount = Number(searchParams.amount);
  const initialBidDollars =
    Number.isInteger(requestedAmount) && requestedAmount * 100 >= category.min_bid_cents
      ? requestedAmount
      : pricing.claimFirstPriceCents / 100;

  return (
    <>
      <VisitTracker />
      <main className="mx-auto max-w-lg px-4 py-10">
        <Link href={`/categories/${category.slug}`} className="text-sm text-slate hover:text-green">
          ← Back to {category.name}
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">Claim your spot</h1>
        <p className="mt-1 text-slate">
          Listing in <strong>{category.name}</strong>. Payment is stubbed for now — submitting takes your listing
          live immediately.
        </p>

        <div className="mt-6">
          <ListingSubmissionForm
            categorySlug={category.slug}
            minBidDollars={category.min_bid_cents / 100}
            initialBidDollars={initialBidDollars}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
