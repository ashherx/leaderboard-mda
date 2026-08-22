import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug } from "@/lib/db/categories";
import { getCategoryPricing, listPublishedListingsForCategory } from "@/lib/db/listings";
import { ListingRow } from "@/components/ListingRow";
import { Pagination } from "@/components/Pagination";
import { ClaimPanel } from "@/components/ClaimPanel";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";
import { SiteHeader } from "@/components/SiteHeader";
import { CategoryPillNav } from "@/components/CategoryPillNav";
import { StatsPill } from "@/components/StatsPill";
import { TrendingPanel } from "@/components/TrendingPanel";
import { LatestActivityPanel } from "@/components/LatestActivityPanel";

const PAGE_SIZE = 25;

// Rank order changes on every bid - never serve a build-time-frozen copy.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return {};

  const title = `${category.name} Leaderboard`;
  const description = category.description ?? `See who's ranked #1 in ${category.name}, ranked purely by bid.`;
  // openGraph.title doesn't inherit the root layout's title template (that
  // only applies to the <title> tag), so the "- The Podium" suffix is
  // spelled out here manually to keep share previews branded.
  return { title, description, openGraph: { title: `${title} - The Podium`, description } };
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
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <CategoryPillNav currentSlug={category.slug} />

        <h1 className="sr-only">{category.name} leaderboard</h1>

        <div className="mt-6">
          <StatsPill />
        </div>

        <div className="mt-8">
          <ClaimPanel
            slug={category.slug}
            categoryName={category.name}
            minBidCents={category.min_bid_cents}
            currentTopCents={pricing.currentTopCents}
            claimFirstPriceCents={pricing.claimFirstPriceCents}
          />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TrendingPanel categoryId={category.id} />
          <LatestActivityPanel categoryId={category.id} />
        </div>

        <div className="mt-10 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">{category.name}</h2>
          <p className="text-sm text-slate">
            {total} listing{total === 1 ? "" : "s"}
          </p>
        </div>
        {category.description && <p className="mt-1 text-sm text-slate">{category.description}</p>}

        {listings.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-white p-10 text-center">
            <p className="font-display text-lg font-semibold text-ink">No one's claimed this category yet</p>
            <p className="mt-1 text-sm text-slate">
              Be the first - claim #1 for just ${pricing.claimFirstPriceCents / 100}.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-white">
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
