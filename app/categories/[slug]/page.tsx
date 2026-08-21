import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug } from "@/lib/db/categories";
import { getCategoryPricing, listPublishedListingsForCategory } from "@/lib/db/listings";
import { ListingRow } from "@/components/ListingRow";
import { Pagination } from "@/components/Pagination";
import { ClaimPanel } from "@/components/ClaimPanel";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";

const PAGE_SIZE = 25;

// Rank order changes on every bid — never serve a build-time-frozen copy.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return {};

  const title = `${category.name} Leaderboard — Agency Bid Leaderboard`;
  const description = category.description ?? `See who's ranked #1 in ${category.name}, ranked purely by bid.`;
  return { title, description, openGraph: { title, description } };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const page = Math.max(1, Number(searchParams.page) || 1);
  const [{ listings, total }, pricing] = await Promise.all([
    listPublishedListingsForCategory(category.id, { page, pageSize: PAGE_SIZE }),
    getCategoryPricing(category.id, category.min_bid_cents),
  ]);

  return (
    <>
      <VisitTracker />
      <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-slate hover:text-green">
        ← All categories
      </Link>

      <h1 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">{category.name}</h1>
      {category.description && <p className="mt-1 text-slate">{category.description}</p>}

      <div className="mt-6">
        <ClaimPanel
          slug={category.slug}
          minBidCents={category.min_bid_cents}
          claimFirstPriceCents={pricing.claimFirstPriceCents}
        />
      </div>

      <p className="mt-6 text-sm text-slate">
        {total} listing{total === 1 ? "" : "s"} in this category
      </p>

      {listings.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-white p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No one's claimed this category yet</p>
          <p className="mt-1 text-sm text-slate">
            Be the first — claim #1 for just ${pricing.claimFirstPriceCents / 100}.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {listings.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </ul>
      )}

      <Pagination basePath={`/categories/${category.slug}`} page={page} pageSize={PAGE_SIZE} total={total} />
      </main>
      <Footer />
    </>
  );
}
