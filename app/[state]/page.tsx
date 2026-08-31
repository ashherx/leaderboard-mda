import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, listActiveCategories } from "@/lib/db/categories";
import { getStateBySlug, listActiveStates } from "@/lib/db/locations";
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

type Params = { state: string };
type SearchParams = { category?: string; page?: string };

// Same fallback as app/layout.tsx's metadataBase.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Matches app/layout.tsx's DESCRIPTION - kept local (not imported) since
// that one isn't exported and this is the only other place needing it.
const DESCRIPTION =
  "The Podium, by Million Dollar Agency - pay-to-rank leaderboards for service providers, ranked purely by who's paid the most.";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const state = await getStateBySlug(params.state);
  if (!state) return {};

  const categories = await listActiveCategories();
  if (categories.length === 0) return {};

  // Every share - a state's homepage, a specific category within it, or
  // "all" - always uses the same static OG_IMAGE now (dropped the
  // per-category dynamic image route): only title/description/canonical vary.
  const title = `The Podium - ${state.name}`;
  let description = `${state.name}: ${DESCRIPTION}`;
  let canonical = `/${state.slug}`;

  if (searchParams.category === ALL_CATEGORIES_SLUG) {
    description = `Every category in ${state.name}, combined - each listing still ranked purely by bid within its own category.`;
    canonical = `/${state.slug}?category=${ALL_CATEGORIES_SLUG}`;
  } else if (searchParams.category) {
    const category = await getCategoryBySlug(searchParams.category);
    if (!category) return {};
    description = category.description
      ? `${category.description} (${state.name})`
      : `See who's ranked #1 in ${category.name} in ${state.name}, ranked purely by bid.`;
    // alternates.canonical: every state+category pair is its own real,
    // distinct page as far as SEO/AI-crawling is concerned (see
    // app/sitemap.ts) even though it's all one route - this points each one
    // at its own ?category= URL (rather than defaulting to bare "/[state]")
    // so it isn't read as a duplicate of the default category's page.
    canonical = `/${state.slug}?category=${category.slug}`;
  }

  return {
    // Spelled out in full (not left to the root layout's title.template) so
    // the browser tab reliably reads "... - The Podium" rather than just
    // the bare category title.
    title,
    description,
    alternates: { canonical },
    // No openGraph.url here - see the <meta property="og:url"> rendered
    // directly in StatePage's JSX below for why.
    openGraph: {
      ...OPEN_GRAPH_SITE_DEFAULTS,
      title: `${title} - Ranked purely by who's paid the most`,
      description,
      images: [{ ...OG_IMAGE, alt: title }],
    },
    // Explicit here (not left to the root layout's `twitter` block): Next
    // only inherits a whole openGraph/twitter object from the parent when a
    // route defines *neither* - since this return already defines
    // openGraph, omitting `twitter` would silently fall back to whatever
    // the layout declares instead of this page's own values.
    twitter: {
      card: "summary_large_image",
      title: `${title} - Ranked purely by who's paid the most`,
      description,
      images: [{ ...OG_IMAGE, alt: title }],
    },
  };
}

export default async function StatePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const state = await getStateBySlug(params.state);
  if (!state) notFound();

  const [categories, states] = await Promise.all([listActiveCategories(), listActiveStates()]);
  if (categories.length === 0) notFound();

  const stateOptions = states.map((s) => ({ slug: s.slug, name: s.name }));

  if (searchParams.category === ALL_CATEGORIES_SLUG) {
    const page = Math.max(1, Number(searchParams.page) || 1);
    const initialData = await getAllCategoriesBrowseData(state.id, page);

    return (
      <>
        {/* Rendered directly rather than via generateMetadata's openGraph.url:
            Next's URL resolver collapses any URL whose pathname is exactly
            "/" down to the bare origin, discarding the query string - since
            every category here lives at "/[state]?category=...", that
            resolver can never produce a working og:url for this site, so
            it's built by hand instead. App Router hoists a <meta> rendered
            anywhere in the tree into <head> on its own, no wrapping <head>
            tag needed. */}
        <meta property="og:url" content={`${SITE_URL}/${state.slug}?category=${ALL_CATEGORIES_SLUG}`} />
        <VisitTracker />
        <SiteHeader states={stateOptions} currentStateSlug={state.slug} currentCategorySlug={ALL_CATEGORIES_SLUG} />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <LeaderboardBrowser
            categories={categories}
            stateSlug={state.slug}
            stateName={state.name}
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
  const initialData = await getCategoryBrowseData(category.id, state.id, category.min_bid_cents, page);

  return (
    <>
      {/* See the matching comment in the "All" branch above - same reason. */}
      <meta property="og:url" content={`${SITE_URL}/${state.slug}?category=${category.slug}`} />
      <VisitTracker />
      <SiteHeader states={stateOptions} currentStateSlug={state.slug} currentCategorySlug={category.slug} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <LeaderboardBrowser
          categories={categories}
          stateSlug={state.slug}
          stateName={state.name}
          initialSlug={category.slug}
          initialData={initialData}
          statsPill={<StatsPill />}
        />
      </main>
      <Footer />
    </>
  );
}
