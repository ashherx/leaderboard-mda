import { listActiveCategories } from "@/lib/db/categories";
import { getCategoryStats } from "@/lib/db/listings";
import { countRecentVisitors } from "@/lib/db/site-visits";
import { CategoryCard } from "@/components/CategoryCard";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";
import { formatCentsAsDollars } from "@/lib/format";

// Bids and stats change constantly — never serve a build-time-frozen copy.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await listActiveCategories();
  const [stats, recentVisitors] = await Promise.all([
    Promise.all(categories.map((c) => getCategoryStats(c.id))),
    countRecentVisitors(),
  ]);

  const totalRaisedCents = stats.reduce((sum, s) => sum + s.totalRaisedCents, 0);
  const totalListings = stats.reduce((sum, s) => sum + s.listingCount, 0);

  return (
    <>
      <VisitTracker />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <header className="text-center">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Agency Bid Leaderboard</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate">
            Ranked purely by who&apos;s paid the most. No portfolios to review, no algorithm — just the highest
            bidder at #1.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 font-mono text-sm text-slate">
            <span>
              <span className="text-lg font-semibold text-ink">{formatCentsAsDollars(totalRaisedCents)}</span> raised
            </span>
            <span>
              <span className="text-lg font-semibold text-ink">{totalListings}</span> listings live
            </span>
            {recentVisitors > 0 && (
              <span>
                <span className="text-lg font-semibold text-green">{recentVisitors}</span> here right now
              </span>
            )}
          </div>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {categories.map((category, i) => (
            <CategoryCard key={category.id} category={category} stats={stats[i]} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
