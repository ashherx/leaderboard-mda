"use client";

import Link from "next/link";
import { useLeaderboardNavigation } from "@/components/LeaderboardNavigation";

/**
 * Every category is its own separate ranking (mixing bids across categories
 * into one list would make "best in category" read as "biggest spender
 * overall," which undersells a category where $50 is genuinely competitive).
 * These are real links so people, search crawlers, and no-JavaScript clients
 * can all discover every category. Next.js still prefetches them for fast
 * App Router transitions.
 */
export function CategoryTabs({
  categories,
  selectedSlug,
  stateSlug,
}: {
  categories: { slug: string; name: string }[];
  selectedSlug: string;
  stateSlug: string;
}) {
  const { startNavigation } = useLeaderboardNavigation();

  return (
    <nav aria-label="Service categories" className="-mx-4 overflow-x-auto border-b border-border px-4">
      {/* w-max + min-w-full: centers the row when it's narrower than the nav
          (nothing to scroll), but once it's wider than min-w-full, w-max
          takes over and the row scrolls left-anchored like normal - centering
          only ever applies to the case with actual free space. */}
      <div className="flex w-max min-w-full justify-center gap-5">
        {categories.map((category) => {
          const isCurrent = category.slug === selectedSlug;
          return (
            <Link
              key={category.slug}
              href={category.slug === "all" ? `/${stateSlug}` : `/${stateSlug}/${category.slug}`}
              aria-current={isCurrent ? "page" : undefined}
              onClick={(event) => {
                if (
                  !isCurrent &&
                  event.button === 0 &&
                  !event.metaKey &&
                  !event.ctrlKey &&
                  !event.shiftKey &&
                  !event.altKey
                ) {
                  startNavigation();
                }
              }}
              className={`shrink-0 whitespace-nowrap border-b-2 py-2 text-sm font-medium transition-colors ${
                isCurrent ? "border-gold text-ink" : "border-transparent text-slate hover:text-ink"
              }`}
            >
              {category.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
