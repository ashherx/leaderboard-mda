import { getSupabaseServerClient } from "@/lib/supabase/server";
import { encryptManageToken, generateManageToken, hashManageToken } from "@/lib/manage-token";
import type { CategoryPricing, Listing, ListingWithRank } from "@/lib/db/types";

const DEFAULT_PAGE_SIZE = 25;

export interface PaginatedListings {
  listings: ListingWithRank[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Published listings for a category, ranked by bid amount. Rank isn't stored
 * anywhere - it's read straight off the `listing_ranks` view, which computes
 * it on the fly via ROW_NUMBER() (see migration 0001 for why).
 */
export async function listPublishedListingsForCategory(
  categoryId: string,
  { page = 1, pageSize = DEFAULT_PAGE_SIZE }: { page?: number; pageSize?: number } = {}
): Promise<PaginatedListings> {
  const supabase = getSupabaseServerClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("listing_ranks")
    .select("*", { count: "exact" })
    .eq("category_id", categoryId)
    .order("rank", { ascending: true })
    .range(from, to);

  if (error) throw error;
  return { listings: data, page, pageSize, total: count ?? 0 };
}

/** What it costs right now to become #1, plus the category's floor price. */
export async function getCategoryPricing(categoryId: string, minBidCents: number): Promise<CategoryPricing> {
  const supabase = getSupabaseServerClient();

  const { data: current, error: currentErr } = await supabase
    .from("listing_ranks")
    .select("bid_amount_cents")
    .eq("category_id", categoryId)
    .eq("rank", 1)
    .maybeSingle();

  if (currentErr) throw currentErr;

  const currentTopCents = current?.bid_amount_cents ?? null;

  return {
    currentTopCents,
    claimFirstPriceCents: currentTopCents === null ? minBidCents : currentTopCents + 100,
    minBidCents,
  };
}

export interface CategoryStats {
  listingCount: number;
  totalRaisedCents: number;
}

/** Homepage/category-header social proof: how many listings, how much raised, in this category. */
export async function getCategoryStats(categoryId: string): Promise<CategoryStats> {
  const supabase = getSupabaseServerClient();
  const { data, error, count } = await supabase
    .from("listings")
    .select("bid_amount_cents", { count: "exact" })
    .eq("category_id", categoryId)
    .eq("status", "published");

  if (error) throw error;
  return {
    listingCount: count ?? 0,
    totalRaisedCents: data.reduce((sum, row) => sum + row.bid_amount_cents, 0),
  };
}

/**
 * Given a bid amount, preview the rank it would earn among a category's
 * *currently published* listings - used by the "try a lower bid" UI before
 * the provider commits to paying. This is a preview only: the real rank at
 * publish time is whatever the listing_ranks view says once the payment
 * completes, since other bids can land in the meantime.
 *
 * Counts listings with bid_amount_cents >= this bid (not just strictly
 * greater): the tie-break rule in listing_ranks is claimed_at ascending, so
 * an existing listing at the exact same amount already outranks a brand-new
 * submission at that amount (it was claimed first). Using `gt` here would
 * preview a rank one better than what publishing would actually produce.
 */
export async function previewRankForBid(categoryId: string, bidAmountCents: number): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("status", "published")
    .gte("bid_amount_cents", bidAmountCents);

  if (error) throw error;
  return (count ?? 0) + 1;
}

export interface CreatePendingListingInput {
  categoryId: string;
  providerName: string;
  pitch: string;
  destinationLink: string;
  logoUrl?: string | null;
  bidAmountCents: number;
}

/**
 * Creates a listing in `pending_payment` status plus its manage-token, ahead
 * of sending the provider to checkout. Returns the raw token - the only time
 * it will ever exist outside the provider's own hands - so the caller can
 * hand it back after payment succeeds (see markListingPublished).
 */
export async function createPendingListing(
  input: CreatePendingListingInput
): Promise<{ listing: Listing; rawManageToken: string }> {
  const supabase = getSupabaseServerClient();
  const rawManageToken = generateManageToken();

  const { data, error } = await supabase
    .from("listings")
    .insert({
      category_id: input.categoryId,
      provider_name: input.providerName,
      pitch: input.pitch,
      destination_link: input.destinationLink,
      logo_url: input.logoUrl ?? null,
      bid_amount_cents: input.bidAmountCents,
      status: "pending_payment",
      manage_token_hash: hashManageToken(rawManageToken),
      manage_token_encrypted: encryptManageToken(rawManageToken),
    })
    .select("*")
    .single();

  if (error) throw error;
  return { listing: data, rawManageToken };
}

/** Publishes a listing once its payment has completed. Idempotent-ish: setting claimed_at only on first publish. */
export async function publishListing(listingId: string, bidAmountCents?: number): Promise<Listing> {
  const supabase = getSupabaseServerClient();

  const { data: existing, error: fetchErr } = await supabase
    .from("listings")
    .select("claimed_at")
    .eq("id", listingId)
    .single();
  if (fetchErr) throw fetchErr;

  const { data, error } = await supabase
    .from("listings")
    .update({
      status: "published",
      claimed_at: existing.claimed_at ?? new Date().toISOString(),
      ...(bidAmountCents ? { bid_amount_cents: bidAmountCents } : {}),
    })
    .eq("id", listingId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export interface ListingContentUpdate {
  providerName: string;
  pitch: string;
  destinationLink: string;
  logoUrl?: string | null;
}

/** Edits content only - no payment involved, doesn't touch bid_amount_cents/status/rank. */
export async function updateListingContent(listingId: string, update: ListingContentUpdate): Promise<Listing> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .update({
      provider_name: update.providerName,
      pitch: update.pitch,
      destination_link: update.destinationLink,
      ...(update.logoUrl !== undefined ? { logo_url: update.logoUrl } : {}),
    })
    .eq("id", listingId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/** Looks up a listing by its raw manage-token, verifying against the stored hash. Never leaks whether a token was "close." */
export async function getListingByManageToken(rawToken: string): Promise<Listing | null> {
  const supabase = getSupabaseServerClient();
  const hash = hashManageToken(rawToken);

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("manage_token_hash", hash)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** The listing's true rank right now - used on the success page, since the rank a provider expected when the form loaded can be stale by the time payment completes. */
export async function getListingRank(listingId: string): Promise<number | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("listing_ranks")
    .select("rank")
    .eq("id", listingId)
    .maybeSingle();

  if (error) throw error;
  return data?.rank ?? null;
}

export async function getPublishedListingById(listingId: string): Promise<Listing | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Unfiltered by status - used on the success page, right after a listing is created/published. */
export async function getListingById(listingId: string): Promise<Listing | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("listings").select("*").eq("id", listingId).maybeSingle();

  if (error) throw error;
  return data;
}

export async function incrementClickCount(listingId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.rpc("increment_listing_click_count", { p_listing_id: listingId });
  if (error) throw error;
}
