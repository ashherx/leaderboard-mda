import { getCategoryById, getCategoryBySlug } from "@/lib/db/categories";
import {
  createPendingListing,
  findActiveListingByDestinationLinkKey,
  getListingByManageToken,
  getListingRank,
  publishListing,
  updateListingContent,
} from "@/lib/db/listings";
import { createPendingPayment, markPaymentCompletedById } from "@/lib/db/payments";
import { normalizeUrlKey, validateDestinationLink } from "@/lib/link-policy";
import { createBidCheckout } from "@/lib/lemonsqueezy/checkout";
import { getRequestOrigin } from "@/lib/request-origin";

export interface ListingContentInput {
  providerName: string;
  pitch: string;
  destinationLink: string;
  logoUrl?: string | null;
}

/** Shared by both initial submission and manage-page edits - same rules either way. */
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
 * Opens a Lemon Squeezy checkout for a listing: a `pending` payment audit
 * row, plus a matching Lemon Squeezy checkout carrying our own payment.id in
 * its custom data. Unlike Paddle, there's no provider id to attach yet here
 * - a Lemon Squeezy checkout's id has no relation to the order it eventually
 * produces, so provider_payment_id only gets attached once the webhook hands
 * that order id back (see completeLemonSqueezyPayment). The listing itself
 * doesn't go live yet - that happens there too, called from the Lemon
 * Squeezy webhook (app/api/webhooks/lemonsqueezy/route.ts) once the checkout
 * actually completes. Returns the checkout URL for the client to open via
 * the Lemon.js overlay.
 *
 * chargeAmountCents and targetBidAmountCents differ for a re-bid: Lemon
 * Squeezy only charges the top-up difference, but the listing's bid should
 * end up at the full new amount - see rebidListingViaToken.
 */
async function startLemonSqueezyCheckout(
  listingId: string,
  chargeAmountCents: number,
  targetBidAmountCents: number,
  name: string,
  description: string,
  // Omitted when this checkout is a top-up of a listing the submitter
  // doesn't control (a duplicate-URL top-up, see submitListingAndCheckout) -
  // there's no manage token to hand them in that case, only a payment id to
  // watch. See app/success/page.tsx for how it branches on that.
  manageToken?: string
): Promise<{ checkoutUrl: string; paymentId: string }> {
  const payment = await createPendingPayment(listingId, chargeAmountCents, "lemonsqueezy");
  const redirectUrl = manageToken
    ? `${getRequestOrigin()}/success?token=${manageToken}&payment=${payment.id}`
    : `${getRequestOrigin()}/success?payment=${payment.id}`;
  const checkoutUrl = await createBidCheckout({
    paymentId: payment.id,
    chargeAmountCents,
    targetBidAmountCents,
    name,
    description,
    redirectUrl,
  });
  return { checkoutUrl, paymentId: payment.id };
}

/** Called by the Lemon Squeezy webhook once an order completes - the only place a real (non-stub) payment actually publishes a listing. */
export async function completeLemonSqueezyPayment(
  paymentId: string,
  orderId: string,
  targetBidAmountCents: number
): Promise<void> {
  let payment;
  try {
    payment = await markPaymentCompletedById(paymentId, orderId);
  } catch {
    return; // Unknown/already-processed payment id - ignore (e.g. a webhook retry).
  }
  await publishListing(payment.listing_id, targetBidAmountCents);
}

export interface SubmitListingInput extends ListingContentInput {
  categorySlug: string;
  bidDollars: number;
}

export type SubmitListingResult =
  | {
      ok: true;
      listingId: string;
      /** Null when this turned into a top-up of someone else's existing listing for the same URL - see the duplicate-URL branch below. */
      rawManageToken: string | null;
      checkoutUrl: string;
      paymentId: string;
      categorySlug: string;
    }
  | { ok: false; error: string };

/**
 * Creates a new listing in pending_payment status and opens a Lemon Squeezy
 * checkout for it - unless the destination URL already belongs to another
 * active listing (any category), in which case this becomes a top-up
 * checkout against *that* listing instead of a second row for the same
 * business. That listing's content/manage-token are untouched either way;
 * the submitter here doesn't get a manage link for it (see
 * startLemonSqueezyCheckout's manageToken param and app/success/page.tsx).
 * Either way, nothing goes live until Lemon Squeezy's webhook confirms payment.
 */
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

  const existing = await findActiveListingByDestinationLinkKey(normalizeUrlKey(content.destinationLink));
  if (existing) {
    const chargeAmountCents = bidAmountCents - existing.bid_amount_cents;
    if (chargeAmountCents <= 0) {
      return {
        ok: false,
        error: `This link is already listed at $${existing.bid_amount_cents / 100}. Enter a higher bid to top it up.`,
      };
    }

    const existingCategory = await getCategoryById(existing.category_id);
    const { checkoutUrl, paymentId } = await startLemonSqueezyCheckout(
      existing.id,
      chargeAmountCents,
      bidAmountCents,
      `${existingCategory?.name ?? "Listing"} re-bid top-up - ${existing.provider_name}`,
      `Duplicate-URL top-up: ${existing.provider_name} in ${existingCategory?.name ?? "unknown category"}, +$${chargeAmountCents / 100} (from $${existing.bid_amount_cents / 100} to $${bidAmountCents / 100})`
    );

    return {
      ok: true,
      listingId: existing.id,
      rawManageToken: null,
      checkoutUrl,
      paymentId,
      categorySlug: existingCategory?.slug ?? category.slug,
    };
  }

  const { listing, rawManageToken } = await createPendingListing({
    categoryId: category.id,
    providerName: content.providerName,
    pitch: content.pitch,
    destinationLink: content.destinationLink,
    logoUrl: input.logoUrl ?? null,
    bidAmountCents,
  });

  const { checkoutUrl, paymentId } = await startLemonSqueezyCheckout(
    listing.id,
    bidAmountCents,
    bidAmountCents,
    `${category.name} listing - ${content.providerName}`,
    `New listing bid: ${content.providerName} in ${category.name}`,
    rawManageToken
  );

  return { ok: true, listingId: listing.id, rawManageToken, checkoutUrl, paymentId, categorySlug: category.slug };
}

export type ManageActionResult =
  | { ok: true; rank: number | null }
  | { ok: false; error: string };

/** Edits a listing's content via its manage-token. No payment involved - bid/rank/status are untouched. */
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

export type RebidResult = { ok: true; checkoutUrl: string; paymentId: string } | { ok: false; error: string };

/**
 * Re-bid via the manage-token: opens a Lemon Squeezy checkout for a new
 * payment against the *existing* listing (never a duplicate).
 * `additionalBidDollars` is a top-up amount, not a new total - the provider
 * has already paid listing.bid_amount_cents for it, so that's exactly what
 * Lemon Squeezy charges and exactly what the listing's bid goes up by. The
 * listing's bid_amount_cents/rank only change once the webhook confirms
 * payment; the currently live listing is untouched until then.
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

  const { checkoutUrl, paymentId } = await startLemonSqueezyCheckout(
    listing.id,
    chargeAmountCents,
    bidAmountCents,
    `${category.name} re-bid top-up - ${listing.provider_name}`,
    `Re-bid top-up: ${listing.provider_name} in ${category.name}, +$${additionalBidDollars} (from $${listing.bid_amount_cents / 100} to $${bidAmountCents / 100})`,
    rawToken
  );

  return { ok: true, checkoutUrl, paymentId };
}
