import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { listActiveCategories } from "@/lib/db/categories";
import { getStateBySlug } from "@/lib/db/locations";
import { getAllCategoriesBrowseData } from "@/lib/db/browse";
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

type PageProps = {
  params: { state: string };
  searchParams: { page?: string };
};

function stateDescription(stateName: string): string {
  return `Browse sponsored service provider leaderboards in ${stateName} by category, or claim a position for your business. Rankings reflect paid bids, not reviews or endorsements.`;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const state = await getStateBySlug(params.state);
  if (!state) return { robots: { index: false, follow: false } };

  const page = parsePageParam(searchParams.page) ?? 1;
  const baseTitle = `${state.name} Service Provider Leaderboards | The Podium`;
  return buildPageMetadata({
    title: page > 1 ? `${baseTitle} - Page ${page}` : baseTitle,
    description: stateDescription(state.name),
    path: pagePath(`/${state.slug}`, page),
    socialTitle: SOCIAL_TITLE,
    socialDescription: SOCIAL_DESCRIPTION,
  });
}

export default async function StatePage({ params, searchParams }: PageProps) {
  const page = parsePageParam(searchParams.page);
  if (page === null) notFound();

  const state = await getStateBySlug(params.state);
  if (!state) notFound();
  if (searchParams.page === "1") permanentRedirect(`/${state.slug}`);

  const categories = await listActiveCategories();
  const firstCategory = categories[0];
  if (!firstCategory) notFound();

  const [initialData, initialClaimPricing] = await Promise.all([
    getAllCategoriesBrowseData(state.id, page),
    getCategoryPricing(firstCategory.id, state.id, firstCategory.min_bid_cents),
  ]);
  if (!pageExists(page, initialData.total, initialData.pageSize)) notFound();

  const description = stateDescription(state.name);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${state.name} sponsored service provider leaderboards`,
    description,
    url: absoluteUrl(pagePath(`/${state.slug}`, page)),
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
          stateSlug={state.slug}
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
