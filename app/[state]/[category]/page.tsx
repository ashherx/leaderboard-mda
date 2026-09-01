import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getCategoryBySlug, listActiveCategories } from "@/lib/db/categories";
import { getStateBySlug } from "@/lib/db/locations";
import { getCategoryBrowseData } from "@/lib/db/browse";
import { pageExists, pagePath, parsePageParam } from "@/lib/pagination";
import { absoluteUrl, buildPageMetadata, serializeJsonLd } from "@/lib/seo";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";
import { SiteHeader } from "@/components/SiteHeader";
import { StatsPill } from "@/components/StatsPill";
import { LeaderboardBrowser } from "@/components/LeaderboardBrowser";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { state: string; category: string };
  searchParams: { page?: string };
};

function categoryDescription(stateName: string, categoryName: string): string {
  return `Compare sponsored ${categoryName} service providers in ${stateName} ranked by paid bid, or claim a position for your business. Rankings are not reviews, quality scores, or endorsements.`;
}

function categorySocialTitle(stateName: string, categoryName: string): string {
  return `Put Your ${stateName} ${categoryName} Business at the Top | The Podium`;
}

function categorySocialDescription(stateName: string, categoryName: string): string {
  return `Market your ${categoryName} business in ${stateName} by bidding for the top sponsored spot. Outbid competitors and put your link where visitors see it first.`;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const state = await getStateBySlug(params.state);
  const category = state ? await getCategoryBySlug(params.category) : null;
  if (!state || !category) return { robots: { index: false, follow: false } };

  const page = parsePageParam(searchParams.page) ?? 1;
  const baseTitle = `${state.name} ${category.name} Service Providers Leaderboard | The Podium`;
  return buildPageMetadata({
    title: page > 1 ? `${baseTitle} - Page ${page}` : baseTitle,
    description: categoryDescription(state.name, category.name),
    path: pagePath(`/${state.slug}/${category.slug}`, page),
    socialTitle: categorySocialTitle(state.name, category.name),
    socialDescription: categorySocialDescription(state.name, category.name),
  });
}

export default async function StateCategoryPage({ params, searchParams }: PageProps) {
  const page = parsePageParam(searchParams.page);
  if (page === null) notFound();

  const state = await getStateBySlug(params.state);
  if (!state) notFound();

  const category = await getCategoryBySlug(params.category);
  if (!category) notFound();
  if (searchParams.page === "1") permanentRedirect(`/${state.slug}/${category.slug}`);

  const [categories, initialData] = await Promise.all([
    listActiveCategories(),
    getCategoryBrowseData(category.id, state.id, category.min_bid_cents, page),
  ]);
  if (!pageExists(page, initialData.total, initialData.pageSize)) notFound();

  const path = pagePath(`/${state.slug}/${category.slug}`, page);
  const description = categoryDescription(state.name, category.name);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl(path)}#collection`,
        name: `${state.name} ${category.name} service provider leaderboard`,
        description,
        url: absoluteUrl(path),
        isPartOf: { "@id": `${absoluteUrl("/")}#website` },
        about: {
          "@type": "Thing",
          name: `${state.name} ${category.name} service providers`,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Service provider leaderboards",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: state.name,
            item: absoluteUrl(`/${state.slug}`),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: category.name,
            item: absoluteUrl(`/${state.slug}/${category.slug}`),
          },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <VisitTracker />
      <SiteHeader currentStateSlug={state.slug} currentCategorySlug={category.slug} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <LeaderboardBrowser
          categories={categories}
          stateSlug={state.slug}
          stateName={state.name}
          initialSlug={category.slug}
          initialData={initialData}
          initialClaimSlug={category.slug}
          initialClaimPricing={initialData.pricing}
          statsPill={<StatsPill />}
        />
      </main>
      <Footer />
    </>
  );
}
