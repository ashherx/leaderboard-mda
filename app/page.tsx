import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { listActiveStates } from "@/lib/db/locations";
import { getCategoryBySlug } from "@/lib/db/categories";
import { pagePath, parsePageParam } from "@/lib/pagination";
import { buildPageMetadata } from "@/lib/seo";
import { SOCIAL_DESCRIPTION, SOCIAL_TITLE } from "@/lib/site";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";
import { SiteHeader } from "@/components/SiteHeader";
import { StatsPill } from "@/components/StatsPill";

export const dynamic = "force-dynamic";

type SearchParams = { category?: string; page?: string };

const TITLE = "The Podium | Sponsored Service Provider Leaderboards";
const DESCRIPTION =
  "Browse sponsored service provider leaderboards by state and category, or claim a position for your business. Rankings reflect paid bids, not reviews or endorsements.";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/",
    socialTitle: SOCIAL_TITLE,
    socialDescription: SOCIAL_DESCRIPTION,
  });
}

/**
 * The root path has no state of its own - every leaderboard lives under
 * /:state. With exactly one active state this used to be (and still is) an
 * unambiguous redirect straight there; with two or more, there's no single
 * obvious destination, so this renders a "choose your state" directory
 * instead (also carrying forward the old query-parameter category URLs -
 * `/?category=plumbers` - to whichever active state sorts first, since those
 * predate states entirely and there's no way to know which one they meant).
 */
export default async function RootPage({ searchParams }: { searchParams: SearchParams }) {
  const page = parsePageParam(searchParams.page);
  if (page === null) notFound();

  const states = await listActiveStates();
  if (states.length === 0) notFound();
  const primaryState = states[0];

  if (searchParams.category !== undefined) {
    const category = await getCategoryBySlug(searchParams.category);
    if (!category) notFound();
    permanentRedirect(pagePath(`/${primaryState.slug}/${category.slug}`, page ?? 1));
  }

  if (states.length === 1) {
    permanentRedirect(pagePath(`/${primaryState.slug}`, page ?? 1));
  }

  return (
    <>
      <VisitTracker />
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-center font-display text-2xl font-bold text-ink">Choose your state</h1>
        <p className="mt-2 text-center text-slate">
          Every leaderboard is local - pick a state to see its sponsored service provider rankings.
        </p>

        <div className="mt-6">
          <StatsPill />
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {states.map((state) => (
            <li key={state.id}>
              <Link
                href={`/${state.slug}`}
                className="block rounded-xl border border-border bg-white px-4 py-3 text-center font-medium text-ink transition-colors hover:border-gold hover:text-green"
              >
                {state.name}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
