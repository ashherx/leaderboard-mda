import { getCategoryById, getCategoryBySlug } from "@/lib/db/categories";
import {
  createPendingListing,
  getListingByManageToken,
  getListingRank,
  publishListing,
  updateListingContent,
} from "@/lib/db/listings";
import { attachProviderPaymentId, createPendingPayment, markPaymentCompleted } from "@/lib/db/payments";
import { validateDestinationLink } from "@/lib/link-policy";
import { createBidTransaction } from "@/lib/paddle/checkout";

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
 * Opens a Paddle checkout for a listing: a `pending` payment audit row plus a
 * matching Paddle transaction, linked via provider_payment_id. The listing
 * itself doesn't go live yet — that happens in completePaddlePayment, called
 * from the Paddle webhook (app/api/webhooks/paddle/route.ts) once the
 * transaction actually completes. Returns the transaction id for the client
 * to open Paddle Checkout against.
 *
 * chargeAmountCents and targetBidAmountCents differ for a re-bid: Paddle only
 * charges the top-up difference, but the listing's bid should end up at the
 * full new amount — see rebidListingViaToken.
 */
async function startPaddleCheckout(
  listingId: string,
  chargeAmountCents: number,
  targetBidAmountCents: number,
  name: string,
  description: string
): Promise<string> {
  const payment = await createPendingPayment(listingId, chargeAmountCents, "paddle");
  const transactionId = await createBidTransaction({
    listingId,
    paymentId: payment.id,
    chargeAmountCents,
    targetBidAmountCents,
    name,
    description,
  });
  await attachProviderPaymentId(payment.id, transactionId);
  return transactionId;
}

/** Called by the Paddle webhook once a transaction completes — the only place a real (non-stub) payment actually publishes a listing. */
export async function completePaddlePayment(transactionId: string, targetBidAmountCents: number): Promise<void> {
  const payment = await markPaymentCompleted(transactionId, "paddle");
  if (!payment) return; // Unknown transaction id, or already processed — ignore.
  await publishListing(payment.listing_id, targetBidAmountCents);
}

export interface SubmitListingInput extends ListingContentInput {
  categorySlug: string;
  bidDollars: number;
}

export type SubmitListingResult =
  | { ok: true; listingId: string; rawManageToken: string; transactionId: string; categorySlug: string }
  | { ok: false; error: string };

/** Creates a new listing in pending_payment status and opens a Paddle checkout for it. It goes live once Paddle's webhook confirms payment. */
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

  const transactionId = await startPaddleCheckout(
    listing.id,
    bidAmountCents,
    bidAmountCents,
    `${category.name} listing — ${content.providerName}`,
    `New listing bid: ${content.providerName} in ${category.name}`
  );

  return { ok: true, listingId: listing.id, rawManageToken, transactionId, categorySlug: category.slug };
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

export type RebidResult = { ok: true; transactionId: string } | { ok: false; error: string };

/**
 * Re-bid via the manage-token: opens a Paddle checkout for a new payment
 * against the *existing* listing (never a duplicate). `additionalBidDollars`
 * is a top-up amount, not a new total — the provider has already paid
 * listing.bid_amount_cents for it, so that's exactly what Paddle charges and
 * exactly what the listing's bid goes up by. The listing's
 * bid_amount_cents/rank only change once the webhook confirms payment; the
 * currently live listing is untouched until then.
 */
export async function rebidListingViaToken(rawToken: string, additionalBidDollars: number): Promise<RebidResult> {
  const listing = await getListingByManageToken(rawToken);
  if (!listing) return { ok: false, error: "Invalid or expired link." };

  const category = await getCategoryById(listing.category_id);
  if (!category) return { ok: false, error: "This listing's category no longer exists." };

  if (!Number.isInteger(additionalBidDollars) || additionalBidDollars <= 0) {
    return { ok: false, error: "Top-up amount must be a whole-dollar amount greater than $0." };
  }
  const chargeAmountCents = additionalBidDollars * 100;
  const bidAmountCents = listing.bid_amount_cents + chargeAmountCents;
  if (bidAmountCents < category.min_bid_cents) {
    return { ok: false, error: `Minimum bid for this category is $${category.min_bid_cents / 100}.` };
  }

  const transactionId = await startPaddleCheckout(
    listing.id,
    chargeAmountCents,
    bidAmountCents,
    `${category.name} re-bid top-up — ${listing.provider_name}`,
    `Re-bid top-up: ${listing.provider_name} in ${category.name}, +$${additionalBidDollars} (from $${listing.bid_amount_cents / 100} to $${bidAmountCents / 100})`
  );

  return { ok: true, transactionId };
}
