import { getSupabaseServerClient } from "@/lib/supabase/server";

const TRENDING_WINDOW_MINUTES = 60;
const PANEL_LIMIT = 5;

/** One row per click, alongside the running-total increment on listings.click_count. */
export async function recordClickEvent(listingId: string, categoryId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("click_events").insert({ listing_id: listingId, category_id: categoryId });
  if (error) throw error;
}

export interface TrendingListing {
  listingId: string;
  providerName: string;
  logoUrl: string | null;
  clicksInWindow: number;
}

/** Real clicks-per-hour, from the click_events log - not a relabeled lifetime total. */
export async function getTrendingListings(categoryId: string): Promise<TrendingListing[]> {
  const supabase = getSupabaseServerClient();
  const since = new Date(Date.now() - TRENDING_WINDOW_MINUTES * 60 * 1000).toISOString();

  const { data: events, error } = await supabase
    .from("click_events")
    .select("listing_id")
    .eq("category_id", categoryId)
    .gt("created_at", since);
  if (error) throw error;
  if (events.length === 0) return [];

  const countByListing = new Map<string, number>();
  for (const e of events) countByListing.set(e.listing_id, (countByListing.get(e.listing_id) ?? 0) + 1);

  const topListingIds = Array.from(countByListing.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, PANEL_LIMIT)
    .map(([id]) => id);

  const { data: listings, error: listingsErr } = await supabase
    .from("listings")
    .select("id, provider_name, logo_url")
    .in("id", topListingIds)
    .eq("status", "published");
  if (listingsErr) throw listingsErr;

  const listingById = new Map(listings.map((l) => [l.id, l]));

  return topListingIds
    .filter((id) => listingById.has(id))
    .map((id) => {
      const listing = listingById.get(id)!;
      return {
        listingId: id,
        providerName: listing.provider_name,
        logoUrl: listing.logo_url,
        clicksInWindow: countByListing.get(id)!,
      };
    });
}

export interface ActivityItem {
  listingId: string;
  providerName: string;
  logoUrl: string | null;
  bidAmountCents: number;
  rank: number | null;
  completedAt: string;
}

/**
 * Real recent claims/re-bids in this category, from completed payments -
 * not a fabricated feed. Shows each listing's *current* rank (not its rank
 * at the moment of that payment), since rank is a live property and
 * re-deriving historical rank would need a much heavier query for a vanity
 * panel.
 */
export async function getLatestActivity(categoryId: string): Promise<ActivityItem[]> {
  const supabase = getSupabaseServerClient();

  const { data: listingIdsRows, error: idsErr } = await supabase
    .from("listings")
    .select("id")
    .eq("category_id", categoryId);
  if (idsErr) throw idsErr;
  const categoryListingIds = listingIdsRows.map((r) => r.id);
  if (categoryListingIds.length === 0) return [];

  const { data: payments, error } = await supabase
    .from("payments")
    .select("listing_id, amount_cents, completed_at")
    .eq("status", "completed")
    .in("listing_id", categoryListingIds)
    .order("completed_at", { ascending: false })
    .limit(PANEL_LIMIT * 3); // over-fetch a bit since some listings may no longer be published
  if (error) throw error;
  if (payments.length === 0) return [];

  const paymentListingIds = Array.from(new Set(payments.map((p) => p.listing_id)));

  const [{ data: listings, error: listingsErr }, { data: ranks, error: ranksErr }] = await Promise.all([
    supabase.from("listings").select("id, provider_name, logo_url, status").in("id", paymentListingIds),
    supabase.from("listing_ranks").select("id, rank").in("id", paymentListingIds),
  ]);
  if (listingsErr) throw listingsErr;
  if (ranksErr) throw ranksErr;

  const listingById = new Map(listings.map((l) => [l.id, l]));
  const rankById = new Map(ranks.map((r) => [r.id, r.rank]));

  const items: ActivityItem[] = [];
  for (const payment of payments) {
    const listing = listingById.get(payment.listing_id);
    if (!listing || listing.status !== "published" || !payment.completed_at) continue;

    items.push({
      listingId: listing.id,
      providerName: listing.provider_name,
      logoUrl: listing.logo_url,
      bidAmountCents: payment.amount_cents,
      rank: rankById.get(listing.id) ?? null,
      completedAt: payment.completed_at,
    });
    if (items.length >= PANEL_LIMIT) break;
  }
  return items;
}
