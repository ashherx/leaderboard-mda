import Link from "next/link";
import { formatCentsAsDollars } from "@/lib/format";
import type { Category } from "@/lib/db/types";
import type { CategoryStats } from "@/lib/db/listings";

export function CategoryCard({ category, stats }: { category: Category; stats: CategoryStats }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex flex-col justify-between rounded-xl border border-border bg-white p-5 transition-colors hover:border-green"
    >
      <div>
        <h3 className="font-display text-lg font-semibold text-ink group-hover:text-green">{category.name}</h3>
        {category.description && <p className="mt-1 text-sm text-slate">{category.description}</p>}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate">
          {stats.listingCount} listing{stats.listingCount === 1 ? "" : "s"}
        </span>
        <span className="font-mono font-semibold text-ink">{formatCentsAsDollars(stats.totalRaisedCents)} raised</span>
      </div>
    </Link>
  );
}
