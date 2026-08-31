import type { MetadataRoute } from "next";
import { listActiveCategories } from "@/lib/db/categories";
import { listActiveStates } from "@/lib/db/locations";
import { ALL_CATEGORIES_SLUG } from "@/lib/all-categories";

// Same fallback as app/layout.tsx's metadataBase.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Categories/states come from a live DB read (getSupabaseServerClient's
// fetches are no-store - see lib/supabase/server.ts), which Next can't
// prerender as a static route at build time - same reasoning as
// app/[state]/page.tsx's own force-dynamic. Without this, `next build`
// fails trying to statically generate /sitemap.xml.
export const dynamic = "force-dynamic";

/**
 * Every (state, category) pair is its own real, crawlable URL via
 * /[state]?category=... (see app/[state]/page.tsx) even though there's only
 * one route behind it - so each active state's every category is listed
 * explicitly here, same for the "All" tab (lib/all-categories.ts) within
 * that state. Only *active* states are listed - an inactive one (not yet
 * turned on from the admin panel) has nothing worth indexing. Static
 * legal/info pages are listed too; /claim, /success, /manage/[token], and
 * /admin are deliberately left out - the first two are per-action pages
 * with no stable content to index, and the last two are excluded from
 * crawling entirely (see app/robots.ts).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, states] = await Promise.all([listActiveCategories(), listActiveStates()]);

  const stateEntries: MetadataRoute.Sitemap = states.flatMap((state) => [
    { url: `${SITE_URL}/${state.slug}`, changeFrequency: "hourly" as const, priority: 0.9 },
    { url: `${SITE_URL}/${state.slug}?category=${ALL_CATEGORIES_SLUG}`, changeFrequency: "hourly" as const, priority: 0.9 },
    ...categories.map((category) => ({
      url: `${SITE_URL}/${state.slug}?category=${category.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ]);

  return [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
    ...stateEntries,
    { url: `${SITE_URL}/rules`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/refunds`, changeFrequency: "yearly", priority: 0.1 },
  ];
}
