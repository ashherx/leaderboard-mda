import type { MetadataRoute } from "next";
import { listActiveCategories } from "@/lib/db/categories";
import { ALL_CATEGORIES_SLUG } from "@/lib/all-categories";

// Same fallback as app/layout.tsx's metadataBase.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Categories come from a live DB read (getSupabaseServerClient's fetches are
// no-store - see lib/supabase/server.ts), which Next can't prerender as a
// static route at build time - same reasoning as app/page.tsx's own
// force-dynamic. Without this, `next build` fails trying to statically
// generate /sitemap.xml.
export const dynamic = "force-dynamic";

/**
 * Every category is its own real, crawlable URL via ?category= (see
 * app/page.tsx) even though there's only one route behind it - so each one
 * is listed explicitly here rather than just the bare homepage, same for
 * the "All" tab (lib/all-categories.ts). Static legal/info pages are listed
 * too; /claim, /success, /manage/[token], and /admin are deliberately left
 * out - the first two are per-action pages with no stable content to index,
 * and the last two are excluded from crawling entirely (see app/robots.ts).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await listActiveCategories();

  const categoryEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/?category=${ALL_CATEGORIES_SLUG}`, changeFrequency: "hourly", priority: 0.9 },
    ...categories.map((category) => ({
      url: `${SITE_URL}/?category=${category.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];

  return [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
    ...categoryEntries,
    { url: `${SITE_URL}/rules`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/refunds`, changeFrequency: "yearly", priority: 0.1 },
  ];
}
