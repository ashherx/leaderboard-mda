"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ClaimPanel } from "@/components/ClaimPanel";
import { ListingRow } from "@/components/ListingRow";
import { Pagination } from "@/components/Pagination";
import { TrendingPanel } from "@/components/TrendingPanel";
import { LatestActivityPanel } from "@/components/LatestActivityPanel";
import type { Category } from "@/lib/db/types";
import type { CategoryBrowseData } from "@/lib/db/browse";

/**
 * Owns which category (and page) is currently on screen, and a client-side
 * cache of every category+page combo already fetched - switching to a
 * cached one is instant (no network), an uncached one shows a brief inline
 * loading state for just the listing area while the rest of the page (tabs,
 * header, chrome) stays put. The URL's ?category= is kept in sync via
 * history.replaceState only, purely so links stay shareable - it never
 * drives a fetch or a Next navigation, so switching never round-trips
 * through the server.
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

  const category = categories.find((c) => c.slug === selectedSlug) ?? categories[0];

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
    if (slug === selectedSlug) return;
    setSelectedSlug(slug);

    const url = new URL(window.location.href);
    url.searchParams.set("category", slug);
    window.history.replaceState(null, "", url);

    load(slug, 1);
  }

  return (
    <>
      <h1 className="sr-only">{category.name} leaderboard</h1>

      <div className="mt-6">{statsPill}</div>

      <div className={`mt-8 transition-opacity ${loading ? "opacity-60" : ""}`}>
        <ClaimPanel
          selectedSlug={selectedSlug}
          selectedCategoryName={category.name}
          pricing={data.pricing}
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          onSelectCategory={selectCategory}
        />
      </div>

      <div className="mt-8">
        <CategoryTabs categories={categories} selectedSlug={selectedSlug} onSelect={selectCategory} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TrendingPanel trending={data.trending} />
        <LatestActivityPanel activity={data.latestActivity} />
      </div>

      <div className="mt-10 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">{category.name}</h2>
        <p className="text-sm text-slate">
          {data.total} listing{data.total === 1 ? "" : "s"}
        </p>
      </div>
      {category.description && <p className="mt-1 text-sm text-slate">{category.description}</p>}

      {data.listings.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-white p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No one's claimed this category yet</p>
          <p className="mt-1 text-sm text-slate">
            Be the first - claim #1 for just ${data.pricing.claimFirstPriceCents / 100}.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-white">
          {data.listings.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </ul>
      )}

      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        onPageChange={(page) => load(selectedSlug, page)}
      />
    </>
  );
}
