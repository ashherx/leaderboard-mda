"use client";

/**
 * Every category is its own separate ranking (mixing bids across categories
 * into one list would make "best in category" read as "biggest spender
 * overall," which undersells a category where $50 is genuinely competitive).
 * This is the sideways move between them - a state swap in LeaderboardBrowser,
 * not a page navigation, so switching is instant.
 */
export function CategoryTabs({
  categories,
  selectedSlug,
  onSelect,
}: {
  categories: { slug: string; name: string }[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <nav className="-mx-4 overflow-x-auto border-b border-border px-4">
      {/* w-max + min-w-full: centers the row when it's narrower than the nav
          (nothing to scroll), but once it's wider than min-w-full, w-max
          takes over and the row scrolls left-anchored like normal - centering
          only ever applies to the case with actual free space. */}
      <div className="flex w-max min-w-full justify-center gap-5">
        {categories.map((category) => {
          const isCurrent = category.slug === selectedSlug;
          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => onSelect(category.slug)}
              className={`shrink-0 whitespace-nowrap border-b-2 py-2 text-sm font-medium transition-colors ${
                isCurrent ? "border-gold text-ink" : "border-transparent text-slate hover:text-ink"
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
