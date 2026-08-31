import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getCategoryBySlug, listActiveCategories } from "@/lib/db/categories";
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
  params: { slug: string };
  searchParams: { page?: string };
};

function categoryDescription(name: string): string {
  return `Compare sponsored ${name} service providers ranked by paid bid, or claim a position for your business. Rankings are not reviews, quality scores, or endorsements.`;
}

function categorySocialTitle(name: string): string {
  return `Put Your ${name} Business at the Top | The Podium`;
}

function categorySocialDescription(name: string): string {
  return `Market your ${name} business by bidding for the top sponsored spot. Outbid competitors and put your link where visitors see it first.`;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return { robots: { index: false, follow: false } };

  const page = parsePageParam(searchParams.page) ?? 1;
  const baseTitle = `${category.name} Service Providers Leaderboard | The Podium`;
  return buildPageMetadata({
    title: page > 1 ? `${baseTitle} - Page ${page}` : baseTitle,
    description: categoryDescription(category.name),
    path: pagePath(`/categories/${category.slug}`, page),
    socialTitle: categorySocialTitle(category.name),
    socialDescription: categorySocialDescription(category.name),
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const page = parsePageParam(searchParams.page);
  if (page === null) notFound();

  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();
  if (searchParams.page === "1") permanentRedirect(`/categories/${category.slug}`);

  const [categories, initialData] = await Promise.all([
    listActiveCategories(),
    getCategoryBrowseData(category.id, category.min_bid_cents, page),
  ]);
  if (!pageExists(page, initialData.total, initialData.pageSize)) notFound();

  const path = pagePath(`/categories/${category.slug}`, page);
  const description = categoryDescription(category.name);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl(path)}#collection`,
        name: `${category.name} service provider leaderboard`,
        description,
        url: absoluteUrl(path),
        isPartOf: { "@id": `${absoluteUrl("/")}#website` },
        about: {
          "@type": "Thing",
          name: `${category.name} service providers`,
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
            name: category.name,
            item: absoluteUrl(`/categories/${category.slug}`),
          },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <VisitTracker />
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <LeaderboardBrowser
          categories={categories}
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
