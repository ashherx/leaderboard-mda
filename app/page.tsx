import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, listActiveCategories } from "@/lib/db/categories";
import { getCategoryBrowseData } from "@/lib/db/browse";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";
import { SiteHeader } from "@/components/SiteHeader";
import { StatsPill } from "@/components/StatsPill";
import { LeaderboardBrowser } from "@/components/LeaderboardBrowser";

// Rank order changes on every bid - never serve a build-time-frozen copy.
export const dynamic = "force-dynamic";

type SearchParams = { category?: string; page?: string };

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const categories = await listActiveCategories();
  if (categories.length === 0) return {};

  const requested = searchParams.category ? await getCategoryBySlug(searchParams.category) : null;
  const category = requested ?? categories[0];

  const title = `${category.name} Leaderboard`;
  const description = category.description ?? `See who's ranked #1 in ${category.name}, ranked purely by bid.`;
  // openGraph.title doesn't inherit the root layout's title template (that
  // only applies to the <title> tag), so the "- The Podium" suffix is
  // spelled out here manually to keep share previews branded. The image is
  // a manual route (not the opengraph-image.tsx file convention) because
  // that convention only varies by route params, not query strings, and
  // category selection lives in ?category= now that browsing is unified.
  return {
    title,
    description,
    openGraph: {
      title: `${title} - The Podium`,
      description,
      images: [`/api/og?category=${category.slug}`],
    },
  };
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const categories = await listActiveCategories();
  if (categories.length === 0) notFound();

  const requested = searchParams.category ? await getCategoryBySlug(searchParams.category) : null;
  const category = requested ?? categories[0];

  const page = Math.max(1, Number(searchParams.page) || 1);
  const initialData = await getCategoryBrowseData(category.id, category.min_bid_cents, page);

  return (
    <>
      <VisitTracker />
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <LeaderboardBrowser
          categories={categories}
          initialSlug={category.slug}
          initialData={initialData}
          statsPill={<StatsPill />}
        />
      </main>
      <Footer />
    </>
  );
}
