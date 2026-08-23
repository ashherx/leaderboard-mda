import {
  getCategoryPricing,
  listPublishedListingsAcrossAllCategories,
  listPublishedListingsForCategory,
} from "@/lib/db/listings";
import { getLatestActivity, getTrendingListings } from "@/lib/db/activity";
import type { ActivityItem, TrendingListing } from "@/lib/db/activity";
import type { CategoryPricing, ListingWithRank } from "@/lib/db/types";

export interface CategoryBrowseData {
  listings: ListingWithRank[];
  total: number;
  page: number;
  pageSize: number;
  pricing: CategoryPricing;
  trending: TrendingListing[];
  latestActivity: ActivityItem[];
}

const PAGE_SIZE = 25;

/**
 * Everything one category's browse view needs, in one call - the unified
 * board fetches this once per category+page (server-side on first load,
 * client-side via /api/categories/[slug]/browse on every subsequent
 * switch) instead of the four separate queries the old per-category page
 * ran through four separate components.
 */
export async function getCategoryBrowseData(
  categoryId: string,
  minBidCents: number,
  page: number
): Promise<CategoryBrowseData> {
  const [{ listings, total }, pricing, trending, latestActivity] = await Promise.all([
    listPublishedListingsForCategory(categoryId, { page, pageSize: PAGE_SIZE }),
    getCategoryPricing(categoryId, minBidCents),
    getTrendingListings(categoryId),
    getLatestActivity(categoryId),
  ]);

  return { listings, total, page, pageSize: PAGE_SIZE, pricing, trending, latestActivity };
}

/**
 * The "All" tab's browse data (see lib/all-categories.ts) - same
 * CategoryBrowseData shape as a single category so LeaderboardBrowser and
 * its children don't need a second data shape to branch on, but `pricing`
 * is a meaningless stub (there's no single "become #1" price across
 * categories with different floors) and trending/latest-activity are empty:
 * both are genuinely category-scoped concepts (see getTrendingListings/
 * getLatestActivity), and the merged listing feed already serves discovery
 * here on its own. The UI hides the panels that would've used those stubs
 * (see LeaderboardBrowser) rather than pretending they mean something.
 */
export async function getAllCategoriesBrowseData(page: number): Promise<CategoryBrowseData> {
  const { listings, total } = await listPublishedListingsAcrossAllCategories({ page, pageSize: PAGE_SIZE });

  return {
    listings,
    total,
    page,
    pageSize: PAGE_SIZE,
    pricing: { currentTopCents: null, claimFirstPriceCents: 0, minBidCents: 0 },
    trending: [],
    latestActivity: [],
  };
}
