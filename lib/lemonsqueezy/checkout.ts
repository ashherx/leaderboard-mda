import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { ensureLemonSqueezyConfigured } from "@/lib/lemonsqueezy/server";
import { SUPPORT_EMAIL } from "@/lib/site";

// Appended to every checkout's description (productOptions.description is
// the only free-text field Lemon Squeezy's checkout API exposes pre-payment
// - there's no separate "terms" field) so a buyer sees the rules and
// chargeback notice on the checkout page itself, not just on /rules.
// Lemon Squeezy renders this field as HTML, not plain text - a "\n" gets
// collapsed like any other whitespace, so actual markup is required for line
// breaks/lists to survive onto the checkout page.
const CHECKOUT_RULES_HTML = `<p><strong>Rules</strong><br>Podium is a public leaderboard. You pay to stand above everyone else. Rank is the bid - nothing else.</p>
<p><strong>How ranking works</strong></p>
<ul>
<li>Bids are whole US dollars.</li>
<li>Paying less than #1 still puts you on the board at whatever rank that bid can take.</li>
<li>You only pay the difference from the current bid. Someone else cannot take your rank by paying that difference.</li>
</ul>
<p><strong>After you pay</strong></p>
<ul>
<li>Your listing is public. Clicks go to the URL or profile you submitted, without query parameters.</li>
<li>A completed payment is what claims the rank.</li>
</ul>
<p><strong>Payment &amp; Chargebacks</strong></p>
<ul>
<li>By completing this purchase, you confirm that you have reviewed the product and pricing and authorize the payment. If you have any issue with your purchase, please contact us at ${SUPPORT_EMAIL} before initiating a payment dispute or chargeback.</li>
<li>Nothing in this policy limits any rights that cannot legally be excluded.</li>
</ul>`;

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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
      description: `<p>${escapeHtml(params.description)}</p>\n${CHECKOUT_RULES_HTML}`,
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
