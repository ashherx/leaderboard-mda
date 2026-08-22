import { getCategoryPricing, listPublishedListingsForCategory } from "@/lib/db/listings";
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
