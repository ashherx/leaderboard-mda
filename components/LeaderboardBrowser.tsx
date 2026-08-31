import type { ReactNode } from "react";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ClaimPanelRouter } from "@/components/ClaimPanelRouter";
import { ListingRow } from "@/components/ListingRow";
import { Pagination } from "@/components/Pagination";
import { TrendingPanel } from "@/components/TrendingPanel";
import { LatestActivityPanel } from "@/components/LatestActivityPanel";
import type { Category, CategoryPricing } from "@/lib/db/types";
import type { CategoryBrowseData } from "@/lib/db/browse";
import { ALL_CATEGORIES_NAME, ALL_CATEGORIES_SLUG } from "@/lib/all-categories";

export function LeaderboardBrowser({
  categories,
  initialSlug,
  initialData,
  initialClaimSlug,
  initialClaimPricing,
  statsPill,
}: {
  categories: Category[];
  initialSlug: string;
  initialData: CategoryBrowseData;
  initialClaimSlug: string;
  initialClaimPricing: CategoryPricing;
  statsPill: ReactNode;
}) {
  const isAll = initialSlug === ALL_CATEGORIES_SLUG;
  const category = isAll
    ? {
        name: ALL_CATEGORIES_NAME,
        description: "Browse every sponsored category while each provider keeps its rank within its own field.",
      }
    : (categories.find((item) => item.slug === initialSlug) ?? categories[0]);
  const categoryNameById = new Map(categories.map((item) => [item.id, item.name]));
  const tabCategories = [
    { slug: ALL_CATEGORIES_SLUG, name: ALL_CATEGORIES_NAME },
    ...categories.map(({ slug, name }) => ({ slug, name })),
  ];
  const basePath = isAll ? "/" : `/categories/${initialSlug}`;

  return (
    <>
      <h1 className="sr-only">
        {isAll ? "Sponsored service provider leaderboards" : `${category.name} service provider leaderboard`}
      </h1>

      <div className="mt-6">{statsPill}</div>

      <div className="mt-8">
        <ClaimPanelRouter
          categories={categories}
          selectedSlug={initialClaimSlug}
          pricing={initialClaimPricing}
        />
      </div>

      <div className="mt-8">
        <CategoryTabs categories={tabCategories} selectedSlug={initialSlug} />
      </div>

      {!isAll && (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TrendingPanel trending={initialData.trending} />
          <LatestActivityPanel activity={initialData.latestActivity} />
        </div>
      )}

      <div>
        <div className="mt-10 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">{category.name}</h2>
          <p className="text-sm text-slate">
            {initialData.total} listing{initialData.total === 1 ? "" : "s"}
          </p>
        </div>
        {category.description && <p className="mt-1 text-sm text-slate">{category.description}</p>}

        {initialData.listings.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-white p-10 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              {isAll ? "No one's claimed a spot yet" : "No one's claimed this category yet"}
            </p>
            <p className="mt-1 text-sm text-slate">
              {isAll
                ? "Pick a category above to claim #1."
                : `Be the first - claim #1 for just $${initialData.pricing.claimFirstPriceCents / 100}.`}
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-white">
            {initialData.listings.map((listing) => (
              <ListingRow
                key={listing.id}
                listing={listing}
                categoryName={isAll ? categoryNameById.get(listing.category_id) : undefined}
              />
            ))}
          </ul>
        )}

        <Pagination
          page={initialData.page}
          pageSize={initialData.pageSize}
          total={initialData.total}
          basePath={basePath}
        />
      </div>
    </>
  );
}
