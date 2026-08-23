import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { completeLemonSqueezyPayment } from "@/lib/checkout";

/**
 * Lemon Squeezy calls this once a checkout is fully paid - it's the only
 * place a real (non-stub) payment actually publishes a listing (see
 * completeLemonSqueezyPayment in lib/checkout.ts). Configure this URL as a
 * webhook destination in the Lemon Squeezy dashboard: Settings > Webhooks,
 * subscribed to `order_created`.
 *
 * Unlike Paddle (whose SDK verifies signatures for you), Lemon Squeezy just
 * signs the raw body with HMAC-SHA256 into the X-Signature header - verified
 * here by hand.
 */
export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Lemon Squeezy webhook received but LEMONSQUEEZY_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // Signature verification needs the exact raw bytes Lemon Squeezy signed -
  // must read as text, never request.json(), or the HMAC won't match.
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-signature") ?? "";

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signatureHeader, "utf8");
  const signatureValid =
    expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!signatureValid) {
    console.error("Lemon Squeezy webhook signature verification failed.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event?.meta?.event_name === "order_created" && event?.data?.attributes?.status === "paid") {
    // The amount actually charged is only the re-bid top-up, not the
    // listing's final bid - the real target came along for the ride in
    // custom data when the checkout was created (see createBidCheckout).
    // Note: the SDK sends checkoutData.custom's keys as camelCase, but Lemon
    // Squeezy serializes/echoes them back as snake_case in the webhook.
    const paymentId = event.meta.custom_data?.payment_id;
    const targetBidAmountCents = Number(event.meta.custom_data?.target_bid_amount_cents);

    if (!paymentId || !Number.isFinite(targetBidAmountCents) || targetBidAmountCents <= 0) {
      console.error("Lemon Squeezy order_created missing/invalid custom_data:", event.data?.id);
    } else {
      await completeLemonSqueezyPayment(paymentId, event.data.id, targetBidAmountCents);
    }
  }

  // Lemon Squeezy retries on non-2xx - always 200 once verified, even for
  // event types we don't act on, so it doesn't keep retrying those forever.
  return NextResponse.json({ ok: true });
}
