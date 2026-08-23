import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { ensureLemonSqueezyConfigured } from "@/lib/lemonsqueezy/server";

/**
 * Every bid is a different whole-dollar amount, so there's no fixed catalog
 * price to sell - instead each checkout overrides the price on one shared
 * LEMONSQUEEZY_VARIANT_ID via customPrice (Lemon Squeezy's non-catalog price,
 * same idea as Paddle's old non-catalog price). Returns the checkout URL,
 * which the client opens via the Lemon.js overlay
 * (window.LemonSqueezy.Url.Open) and the webhook later completes by
 * `paymentId`, not by any id from this checkout - see lib/checkout.ts.
 */
export async function createBidCheckout(params: {
  paymentId: string;
  /** What Lemon Squeezy actually charges - the full bid on a new listing, but only the top-up difference on a re-bid (see startLemonSqueezyCheckout). */
  chargeAmountCents: number;
  /** The bid amount the listing should end up at once paid - always the full new bid, even when chargeAmountCents is just a top-up. Carried through checkoutData.custom for the webhook to publish with. */
  targetBidAmountCents: number;
  /** Customer-facing product name, shown on the checkout itself. */
  name: string;
  /** Customer-facing product description, shown on the checkout itself. */
  description: string;
  /** Where Lemon Squeezy sends the browser once payment completes - the success page, watching this specific payment. */
  redirectUrl: string;
}): Promise<string> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
  if (!storeId || !variantId) {
    throw new Error("LEMONSQUEEZY_STORE_ID or LEMONSQUEEZY_VARIANT_ID is not set - see .env.local.example.");
  }

  ensureLemonSqueezyConfigured();

  const { data, error } = await createCheckout(storeId, variantId, {
    customPrice: params.chargeAmountCents,
    productOptions: {
      name: params.name,
      description: params.description,
      redirectUrl: params.redirectUrl,
    },
    checkoutData: {
      custom: {
        paymentId: params.paymentId,
        targetBidAmountCents: String(params.targetBidAmountCents),
      },
    },
  });

  if (error || !data) {
    throw error ?? new Error("Lemon Squeezy checkout creation returned no data.");
  }

  return data.data.attributes.url;
}
