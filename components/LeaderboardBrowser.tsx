"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ClaimPanel } from "@/components/ClaimPanel";
import { ListingRow } from "@/components/ListingRow";
import { Pagination } from "@/components/Pagination";
import { TrendingPanel } from "@/components/TrendingPanel";
import { LatestActivityPanel } from "@/components/LatestActivityPanel";
import type { Category } from "@/lib/db/types";
import type { CategoryBrowseData } from "@/lib/db/browse";
import { ALL_CATEGORIES_NAME, ALL_CATEGORIES_SLUG } from "@/lib/all-categories";

/**
 * Owns which category (and page) is currently on screen, and a client-side
 * cache of every category+page combo already fetched - switching to a
 * cached one is instant (no network), an uncached one shows a brief inline
 * loading state for just the listing area while the rest of the page (tabs,
 * header, chrome) stays put. The URL's ?category= is kept in sync via
 * history.replaceState only, purely so links stay shareable - it never
 * drives a fetch or a Next navigation, so switching never round-trips
 * through the server.
 *
 * "All" (see lib/all-categories.ts) is a real, browsable selection here -
 * it drives the tabs and the merged listing feed below - but it is
 * deliberately NOT something the claim panel can target: there's no single
 * category to bid into called "All", and mixing bids across categories is
 * exactly what this app avoids (see CategoryTabs' comment). So the claim
 * panel's own category (claimSlug) is tracked separately from the browse
 * selection (selectedSlug): picking a real category (via a tab or the claim
 * panel's own dropdown) updates both, but switching the browse view to
 * "All" leaves the claim panel right where it was.
 */
export function LeaderboardBrowser({
  categories,
  initialSlug,
  initialData,
  statsPill,
}: {
  categories: Category[];
  initialSlug: string;
  initialData: CategoryBrowseData;
  statsPill: ReactNode;
}) {
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const cache = useRef(new Map<string, CategoryBrowseData>([[`${initialSlug}:${initialData.page}`, initialData]]));

  const isAll = selectedSlug === ALL_CATEGORIES_SLUG;
  const category = isAll
    ? { name: ALL_CATEGORIES_NAME, description: "Every category, combined - each listing still ranked purely by bid within its own category." }
    : (categories.find((c) => c.slug === selectedSlug) ?? categories[0]);

  const categoryNameById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const [claimSlug, setClaimSlug] = useState(initialSlug === ALL_CATEGORIES_SLUG ? (categories[0]?.slug ?? "") : initialSlug);
  const [claimData, setClaimData] = useState<CategoryBrowseData | null>(
    initialSlug === ALL_CATEGORIES_SLUG ? null : initialData
  );

  // Whatever the claim panel is currently targeting, make sure its own
  // pricing is loaded - separate from `load`/`data` below since the two can
  // legitimately be different categories (browsing "All" while claiming
  // into one specific one).
  useEffect(() => {
    if (!claimSlug) return;
    const key = `${claimSlug}:1`;
    const cached = cache.current.get(key);
    if (cached) {
      setClaimData(cached);
      return;
    }

    fetch(`/api/categories/${claimSlug}/browse?page=1`)
      .then((res) => res.json())
      .then((payload: CategoryBrowseData) => {
        cache.current.set(key, payload);
        setClaimData(payload);
      })
      .catch(() => {
        /* transient - claim panel just keeps showing its last known pricing */
      });
  }, [claimSlug]);

  const load = useCallback((slug: string, page: number) => {
    const key = `${slug}:${page}`;
    const cached = cache.current.get(key);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/categories/${slug}/browse?page=${page}`)
      .then((res) => res.json())
      .then((payload: CategoryBrowseData) => {
        cache.current.set(key, payload);
        setData(payload);
      })
      .catch(() => {
        /* transient - stay on whatever was showing */
      })
      .finally(() => setLoading(false));
  }, []);

  function selectCategory(slug: string) {
    if (slug !== ALL_CATEGORIES_SLUG) setClaimSlug(slug);

    if (slug === selectedSlug) return;
    setSelectedSlug(slug);

    const url = new URL(window.location.href);
    url.searchParams.set("category", slug);
    window.history.replaceState(null, "", url);

    load(slug, 1);
  }

  const tabCategories = [
    { slug: ALL_CATEGORIES_SLUG, name: ALL_CATEGORIES_NAME },
    ...categories.map((c) => ({ slug: c.slug, name: c.name })),
  ];
  const claimCategoryName = categories.find((c) => c.slug === claimSlug)?.name ?? "";

  return (
    <>
      <h1 className="sr-only">{category.name} leaderboard</h1>

      <div className="mt-6">{statsPill}</div>

      {claimData && (
        <div className="mt-8">
          <ClaimPanel
            selectedSlug={claimSlug}
            selectedCategoryName={claimCategoryName}
            pricing={claimData.pricing}
            categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
            onSelectCategory={selectCategory}
          />
        </div>
      )}

      <div className="mt-8">
        <CategoryTabs categories={tabCategories} selectedSlug={selectedSlug} onSelect={selectCategory} />
      </div>

      {!isAll && (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TrendingPanel trending={data.trending} />
          <LatestActivityPanel activity={data.latestActivity} />
        </div>
      )}

      <div className={`transition-opacity ${loading ? "opacity-60" : ""}`}>
        <div className="mt-10 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">{category.name}</h2>
          <p className="text-sm text-slate">
            {data.total} listing{data.total === 1 ? "" : "s"}
          </p>
        </div>
        {category.description && <p className="mt-1 text-sm text-slate">{category.description}</p>}

        {data.listings.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-white p-10 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              {isAll ? "No one's claimed a spot yet" : "No one's claimed this category yet"}
            </p>
            <p className="mt-1 text-sm text-slate">
              {isAll
                ? "Pick a category above to claim #1."
                : `Be the first - claim #1 for just $${data.pricing.claimFirstPriceCents / 100}.`}
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-white">
            {data.listings.map((listing) => (
              <ListingRow
                key={listing.id}
                listing={listing}
                categoryName={isAll ? categoryNameById.get(listing.category_id) : undefined}
              />
            ))}
          </ul>
        )}

        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={(page) => load(selectedSlug, page)}
        />
      </div>
    </>
  );
}
