import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { listActiveCategories, getCategoryBySlug } from "@/lib/db/categories";
import { getAllCategoriesBrowseData, getCategoryBrowseData } from "@/lib/db/browse";
import { getCategoryPricing } from "@/lib/db/listings";
import { ALL_CATEGORIES_SLUG } from "@/lib/all-categories";
import { pageExists, pagePath, parsePageParam } from "@/lib/pagination";
import { absoluteUrl, buildPageMetadata, serializeJsonLd } from "@/lib/seo";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";
import { SiteHeader } from "@/components/SiteHeader";
import { StatsPill } from "@/components/StatsPill";
import { LeaderboardBrowser } from "@/components/LeaderboardBrowser";
import { SOCIAL_DESCRIPTION, SOCIAL_TITLE } from "@/lib/site";

export const dynamic = "force-dynamic";

type SearchParams = { category?: string; page?: string };

const TITLE = "The Podium | Sponsored Service Provider Leaderboards";
const DESCRIPTION =
  "Browse sponsored service provider leaderboards by category, or claim a position for your business. Rankings reflect paid bids, not reviews or endorsements.";

export function generateMetadata({ searchParams }: { searchParams: SearchParams }): Metadata {
  const page = parsePageParam(searchParams.page);
  const validPage = page ?? 1;
  const title = validPage > 1 ? `${TITLE} - Page ${validPage}` : TITLE;
  return buildPageMetadata({
    title,
    description: DESCRIPTION,
    path: pagePath("/", validPage),
    socialTitle: SOCIAL_TITLE,
    socialDescription: SOCIAL_DESCRIPTION,
  });
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const page = parsePageParam(searchParams.page);
  if (page === null) notFound();

  // Preserve search equity and shared links from the former query-parameter
  // category URLs while making the destination path the only canonical form.
  if (searchParams.category !== undefined) {
    if (searchParams.category === ALL_CATEGORIES_SLUG) {
      const legacyData = await getAllCategoriesBrowseData(page);
      if (!pageExists(page, legacyData.total, legacyData.pageSize)) notFound();
      permanentRedirect(pagePath("/", page));
    }

    const category = await getCategoryBySlug(searchParams.category);
    if (!category) notFound();
    const legacyData = await getCategoryBrowseData(category.id, category.min_bid_cents, page);
    if (!pageExists(page, legacyData.total, legacyData.pageSize)) notFound();
    permanentRedirect(pagePath(`/categories/${category.slug}`, page));
  }

  if (searchParams.page === "1") permanentRedirect("/");

  const categories = await listActiveCategories();
  const firstCategory = categories[0];
  if (!firstCategory) notFound();

  const [initialData, initialClaimPricing] = await Promise.all([
    getAllCategoriesBrowseData(page),
    getCategoryPricing(firstCategory.id, firstCategory.min_bid_cents),
  ]);
  if (!pageExists(page, initialData.total, initialData.pageSize)) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Sponsored service provider leaderboards",
    description: DESCRIPTION,
    url: absoluteUrl(pagePath("/", page)),
    isPartOf: { "@id": `${absoluteUrl("/")}#website` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <VisitTracker />
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <LeaderboardBrowser
          categories={categories}
          initialSlug={ALL_CATEGORIES_SLUG}
          initialData={initialData}
          initialClaimSlug={firstCategory.slug}
          initialClaimPricing={initialClaimPricing}
          statsPill={<StatsPill />}
        />
      </main>
      <Footer />
    </>
  );
}
