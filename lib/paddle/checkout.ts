import { getPaddleClient } from "@/lib/paddle/server";

/**
 * Every bid is a different whole-dollar amount, so there's no fixed catalog
 * price to sell — instead each transaction gets a one-off ("non-catalog")
 * price attached to a single shared PADDLE_PRODUCT_ID. Returns the new
 * transaction's id, which the client opens Paddle Checkout against and the
 * webhook later looks payments up by.
 */
export async function createBidTransaction(params: {
  listingId: string;
  paymentId: string;
  amountCents: number;
  description: string;
}): Promise<string> {
  const productId = process.env.PADDLE_PRODUCT_ID;
  if (!productId) {
    throw new Error("PADDLE_PRODUCT_ID is not set — see .env.local.example.");
  }

  const paddle = getPaddleClient();
  const transaction = await paddle.transactions.create({
    items: [
      {
        quantity: 1,
        price: {
          description: params.description,
          productId,
          unitPrice: { amount: String(params.amountCents), currencyCode: "USD" },
        },
      },
    ],
    customData: { listingId: params.listingId, paymentId: params.paymentId },
  });

  return transaction.id;
}
