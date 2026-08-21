import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, Listing, PaymentStatus } from "@/lib/db/types";

export interface AdminListingRow extends Listing {
  categoryName: string;
  categorySlug: string;
  rank: number | null; // only meaningful when status === 'published'
  latestPaymentStatus: PaymentStatus | null;
}

export interface AdminListingFilters {
  categoryId?: string;
  status?: Listing["status"];
}

/**
 * Every listing across every category/status, for the admin table. Kept as
 * its own query (rather than reusing the public listing_ranks view) since
 * admin needs pending/unpublished rows too, which that view deliberately
 * excludes.
 */
export async function listAllListingsForAdmin(filters: AdminListingFilters = {}): Promise<AdminListingRow[]> {
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from("listings")
    .select("*, categories(name, slug)")
    .order("created_at", { ascending: false });

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.status) query = query.eq("status", filters.status);

  const { data: listings, error } = await query;
  if (error) throw error;
  if (listings.length === 0) return [];

  const listingIds = listings.map((l) => l.id);

  const [{ data: ranks, error: rankErr }, { data: payments, error: paymentErr }] = await Promise.all([
    supabase.from("listing_ranks").select("id, rank").in("id", listingIds),
    supabase
      .from("payments")
      .select("listing_id, status, created_at")
      .in("listing_id", listingIds)
      .order("created_at", { ascending: false }),
  ]);
  if (rankErr) throw rankErr;
  if (paymentErr) throw paymentErr;

  const rankById = new Map(ranks.map((r) => [r.id, r.rank]));
  // payments is ordered newest-first, so the first match per listing_id is the latest.
  const latestPaymentByListing = new Map<string, PaymentStatus>();
  for (const p of payments) {
    if (!latestPaymentByListing.has(p.listing_id)) latestPaymentByListing.set(p.listing_id, p.status);
  }

  return listings.map((listing) => {
    // Supabase types this embed loosely; narrow it defensively rather than trusting shape.
    const embedded = (listing as unknown as { categories: { name: string; slug: string } | null }).categories;
    return {
      ...listing,
      categoryName: embedded?.name ?? "—",
      categorySlug: embedded?.slug ?? "",
      rank: rankById.get(listing.id) ?? null,
      latestPaymentStatus: latestPaymentByListing.get(listing.id) ?? null,
    };
  });
}

export async function unpublishListing(listingId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("listings").update({ status: "unpublished" }).eq("id", listingId);
  if (error) throw error;
}

export async function setListingVerified(listingId: string, verified: boolean): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("listings").update({ is_verified: verified }).eq("id", listingId);
  if (error) throw error;
}

/** All categories, including hidden ones — for the admin category manager. */
export async function listAllCategoriesForAdmin(): Promise<Category[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("categories").select("*").order("display_order", { ascending: true });
  if (error) throw error;
  return data;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCategory(name: string, minBidCents: number): Promise<Category> {
  const supabase = getSupabaseServerClient();

  const { data: existing, error: maxErr } = await supabase
    .from("categories")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxErr) throw maxErr;

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      slug: slugify(name),
      min_bid_cents: minBidCents,
      display_order: (existing?.display_order ?? 0) + 10,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export interface CategoryUpdate {
  name?: string;
  isActive?: boolean;
  displayOrder?: number;
  minBidCents?: number;
}

export async function updateCategory(categoryId: string, update: CategoryUpdate): Promise<Category> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .update({
      ...(update.name !== undefined ? { name: update.name } : {}),
      ...(update.isActive !== undefined ? { is_active: update.isActive } : {}),
      ...(update.displayOrder !== undefined ? { display_order: update.displayOrder } : {}),
      ...(update.minBidCents !== undefined ? { min_bid_cents: update.minBidCents } : {}),
    })
    .eq("id", categoryId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
