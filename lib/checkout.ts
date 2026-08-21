import { randomUUID } from "crypto";
import { getCategoryById, getCategoryBySlug } from "@/lib/db/categories";
import {
  createPendingListing,
  getListingByManageToken,
  getListingRank,
  publishListing,
  updateListingContent,
} from "@/lib/db/listings";
import { createPendingPayment, markPaymentCompletedById } from "@/lib/db/payments";
import { validateDestinationLink } from "@/lib/link-policy";

export interface ListingContentInput {
  providerName: string;
  pitch: string;
  destinationLink: string;
  logoUrl?: string | null;
}

/** Shared by both initial submission and manage-page edits — same rules either way. */
function validateListingContent(
  input: ListingContentInput
): { ok: true; providerName: string; pitch: string; destinationLink: string } | { ok: false; error: string } {
  const providerName = input.providerName.trim();
  const pitch = input.pitch.trim();

  if (!providerName || providerName.length > 80) {
    return { ok: false, error: "Provider name is required (80 characters max)." };
  }
  if (!pitch || pitch.length > 140) {
    return { ok: false, error: "One-line pitch is required (140 characters max)." };
  }

  const linkCheck = validateDestinationLink(input.destinationLink);
  if (!linkCheck.ok) return { ok: false, error: linkCheck.error };

  return { ok: true, providerName, pitch, destinationLink: linkCheck.url };
}

/**
 * Stands in for "redirect to checkout, then a webhook marks the payment
 * completed" — payments aren't wired up to a real provider yet. Swapping in
 * Lemon Squeezy later means replacing just this function's body with a
 * checkout redirect, and moving the publishListing() call into the webhook
 * handler; every caller below stays the same.
 */
async function runStubPaymentAndPublish(listingId: string, amountCents: number): Promise<void> {
  const payment = await createPendingPayment(listingId, amountCents, "manual");
  await markPaymentCompletedById(payment.id, `manual-${randomUUID()}`);
  await publishListing(listingId, amountCents);
}

export interface SubmitListingInput extends ListingContentInput {
  categorySlug: string;
  bidDollars: number;
}

export type SubmitListingResult =
  | { ok: true; listingId: string; rawManageToken: string; rank: number; categorySlug: string }
  | { ok: false; error: string };

/** Creates a new listing + payment and takes it live. */
export async function submitListingAndCheckout(input: SubmitListingInput): Promise<SubmitListingResult> {
  const category = await getCategoryBySlug(input.categorySlug);
  if (!category) return { ok: false, error: "Category not found." };

  const content = validateListingContent(input);
  if (!content.ok) return content;

  if (!Number.isInteger(input.bidDollars) || input.bidDollars <= 0) {
    return { ok: false, error: "Bid must be a whole-dollar amount." };
  }
  const bidAmountCents = input.bidDollars * 100;
  if (bidAmountCents < category.min_bid_cents) {
    return { ok: false, error: `Minimum bid for this category is $${category.min_bid_cents / 100}.` };
  }

  const { listing, rawManageToken } = await createPendingListing({
    categoryId: category.id,
    providerName: content.providerName,
    pitch: content.pitch,
    destinationLink: content.destinationLink,
    logoUrl: input.logoUrl ?? null,
    bidAmountCents,
  });

  await runStubPaymentAndPublish(listing.id, bidAmountCents);

  const rank = await getListingRank(listing.id);
  if (rank === null) {
    // Shouldn't happen — runStubPaymentAndPublish just set status to
    // 'published' — but fail loudly rather than send the provider to a
    // broken success page.
    return { ok: false, error: "Listing was created but its rank couldn't be determined. Contact support." };
  }

  return { ok: true, listingId: listing.id, rawManageToken, rank, categorySlug: category.slug };
}

export type ManageActionResult =
  | { ok: true; rank: number | null }
  | { ok: false; error: string };

/** Edits a listing's content via its manage-token. No payment involved — bid/rank/status are untouched. */
export async function editListingViaToken(
  rawToken: string,
  input: ListingContentInput
): Promise<ManageActionResult> {
  const listing = await getListingByManageToken(rawToken);
  if (!listing) return { ok: false, error: "Invalid or expired link." };

  const content = validateListingContent(input);
  if (!content.ok) return content;

  await updateListingContent(listing.id, {
    providerName: content.providerName,
    pitch: content.pitch,
    destinationLink: content.destinationLink,
    logoUrl: input.logoUrl,
  });

  const rank = await getListingRank(listing.id);
  return { ok: true, rank };
}

/**
 * Re-bid via the manage-token: a new payment against the *existing* listing
 * (never a duplicate), which then takes over its bid_amount_cents and
 * publishes/republishes it at whatever rank that new amount earns.
 */
export async function rebidListingViaToken(rawToken: string, bidDollars: number): Promise<ManageActionResult> {
  const listing = await getListingByManageToken(rawToken);
  if (!listing) return { ok: false, error: "Invalid or expired link." };

  const category = await getCategoryById(listing.category_id);
  if (!category) return { ok: false, error: "This listing's category no longer exists." };

  if (!Number.isInteger(bidDollars) || bidDollars <= 0) {
    return { ok: false, error: "Bid must be a whole-dollar amount." };
  }
  const bidAmountCents = bidDollars * 100;
  if (bidAmountCents < category.min_bid_cents) {
    return { ok: false, error: `Minimum bid for this category is $${category.min_bid_cents / 100}.` };
  }

  await runStubPaymentAndPublish(listing.id, bidAmountCents);

  const rank = await getListingRank(listing.id);
  return { ok: true, rank };
}
