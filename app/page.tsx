import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, listActiveCategories } from "@/lib/db/categories";
import { getAllCategoriesBrowseData, getCategoryBrowseData } from "@/lib/db/browse";
import { ALL_CATEGORIES_NAME, ALL_CATEGORIES_SLUG } from "@/lib/all-categories";
import { OG_IMAGE, OPEN_GRAPH_SITE_DEFAULTS } from "@/lib/site";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";
import { SiteHeader } from "@/components/SiteHeader";
import { StatsPill } from "@/components/StatsPill";
import { LeaderboardBrowser } from "@/components/LeaderboardBrowser";

// Rank order changes on every bid - never serve a build-time-frozen copy.
export const dynamic = "force-dynamic";

type SearchParams = { category?: string; page?: string };

// Same fallback as app/layout.tsx's metadataBase.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const categories = await listActiveCategories();
  if (categories.length === 0) return {};

  if (searchParams.category === ALL_CATEGORIES_SLUG) {
    const title = `${ALL_CATEGORIES_NAME} Leaderboard`;
    const description = "Every category, combined - each listing still ranked purely by bid within its own category.";
    return {
      title,
      description,
      alternates: { canonical: `/?category=${ALL_CATEGORIES_SLUG}` },
      // No openGraph.url here - see the <meta property="og:url"> rendered
      // directly in HomePage's JSX below for why.
      openGraph: {
        ...OPEN_GRAPH_SITE_DEFAULTS,
        title: `${title} - The Podium`,
        description,
        // No per-category dynamic image makes sense for a merged "All" view
        // (there's no single category to headline) - the static site image
        // still beats no image at all for FB/LinkedIn/Discord/Slack previews.
        images: [{ ...OG_IMAGE, alt: "The Podium" }],
      },
    };
  }

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
  //
  // alternates.canonical: every category is its own real, distinct page as
  // far as SEO/AI-crawling is concerned (see app/sitemap.ts) even though
  // it's all one route - this points each one at its own ?category= URL
  // (rather than defaulting to bare "/") so it isn't read as a duplicate of
  // the default category's page.
  return {
    title,
    description,
    alternates: { canonical: `/?category=${category.slug}` },
    // No openGraph.url here either - same reason as the "All" branch above.
    openGraph: {
      ...OPEN_GRAPH_SITE_DEFAULTS,
      title: `${title} - The Podium`,
      description,
      // Matches SIZE in app/api/og/route.tsx.
      images: [{ url: `/api/og?category=${category.slug}`, width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const categories = await listActiveCategories();
  if (categories.length === 0) notFound();

  if (searchParams.category === ALL_CATEGORIES_SLUG) {
    const page = Math.max(1, Number(searchParams.page) || 1);
    const initialData = await getAllCategoriesBrowseData(page);

    return (
      <>
        {/* Rendered directly rather than via generateMetadata's openGraph.url:
            Next's URL resolver collapses any URL whose pathname is exactly
            "/" down to the bare origin, discarding the query string - since
            every category here lives at "/?category=...", that resolver
            can never produce a working og:url for this site, so it's built
            by hand instead. App Router hoists a <meta> rendered anywhere in
            the tree into <head> on its own, no wrapping <head> tag needed. */}
        <meta property="og:url" content={`${SITE_URL}/?category=${ALL_CATEGORIES_SLUG}`} />
        <VisitTracker />
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <LeaderboardBrowser
            categories={categories}
            initialSlug={ALL_CATEGORIES_SLUG}
            initialData={initialData}
            statsPill={<StatsPill />}
          />
        </main>
        <Footer />
      </>
    );
  }

  const requested = searchParams.category ? await getCategoryBySlug(searchParams.category) : null;
  const category = requested ?? categories[0];

  const page = Math.max(1, Number(searchParams.page) || 1);
  const initialData = await getCategoryBrowseData(category.id, category.min_bid_cents, page);

  return (
    <>
      {/* See the matching comment in the "All" branch above - same reason. */}
      <meta property="og:url" content={`${SITE_URL}/?category=${category.slug}`} />
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
