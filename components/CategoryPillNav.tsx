import Link from "next/link";
import { listActiveCategories } from "@/lib/db/categories";

/**
 * Every category is its own separate ranking (mixing bids across categories
 * into one list would make "best in category" read as "biggest spender
 * overall," which undersells a category where $50 is genuinely competitive).
 * This is the sideways move between them — one click, no trip back through
 * the homepage.
 */
export async function CategoryPillNav({ currentSlug }: { currentSlug: string }) {
  const categories = await listActiveCategories();

  return (
    <nav className="-mx-4 overflow-x-auto border-b border-border px-4">
      <div className="flex w-max gap-5">
        {categories.map((category) => {
          const isCurrent = category.slug === currentSlug;
          return (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
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
