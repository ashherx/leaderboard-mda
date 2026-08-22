import { getPaddleClient } from "@/lib/paddle/server";

/**
 * Every bid is a different whole-dollar amount, so there's no fixed catalog
 * price to sell - instead each transaction gets a one-off ("non-catalog")
 * price attached to a single shared PADDLE_PRODUCT_ID. Returns the new
 * transaction's id, which the client opens Paddle Checkout against and the
 * webhook later looks payments up by.
 */
export async function createBidTransaction(params: {
  listingId: string;
  paymentId: string;
  /** What Paddle actually charges - the full bid on a new listing, but only the top-up difference on a re-bid (see startPaddleCheckout). */
  chargeAmountCents: number;
  /** The bid amount the listing should end up at once paid - always the full new bid, even when chargeAmountCents is just a top-up. Carried through customData for the webhook to publish with. */
  targetBidAmountCents: number;
  /** Customer-facing line-item name, shown on the checkout itself. */
  name: string;
  /** Internal-only note, shown in the Paddle dashboard but never to the customer. */
  description: string;
}): Promise<string> {
  const productId = process.env.PADDLE_PRODUCT_ID;
  if (!productId) {
    throw new Error("PADDLE_PRODUCT_ID is not set - see .env.local.example.");
  }

  const paddle = getPaddleClient();
  const transaction = await paddle.transactions.create({
    items: [
      {
        quantity: 1,
        price: {
          name: params.name,
          description: params.description,
          productId,
          unitPrice: { amount: String(params.chargeAmountCents), currencyCode: "USD" },
          // Locks quantity to exactly 1 - without this Paddle Checkout shows
          // a +/- stepper, which makes no sense for a fixed-price bid.
          quantity: { minimum: 1, maximum: 1 },
        },
      },
    ],
    customData: {
      listingId: params.listingId,
      paymentId: params.paymentId,
      targetBidAmountCents: String(params.targetBidAmountCents),
    },
  });

  return transaction.id;
}
