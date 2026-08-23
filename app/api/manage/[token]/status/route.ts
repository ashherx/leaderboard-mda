import { NextResponse } from "next/server";
import { getListingByManageToken, getListingRank } from "@/lib/db/listings";
import { getPaymentById } from "@/lib/db/payments";

/**
 * Polled by the success page (see PendingPaymentNotice) while it waits for
 * the Lemon Squeezy webhook to land. `payment` (our own payment.id, known
 * upfront when the checkout was created) is the authoritative signal when
 * given - on a re-bid the listing is already `published`, so that flag
 * alone can't tell "this specific payment confirmed" apart from "still
 * showing the rank from before this checkout." Without `payment` (older
 * links, or genuinely no payment to watch) it falls back to listing.status.
 */
export async function GET(request: Request, { params }: { params: { token: string } }) {
  const listing = await getListingByManageToken(params.token);
  if (!listing) {
    return NextResponse.json({ ok: false, error: "Invalid or expired link." }, { status: 404 });
  }

  const paymentId = new URL(request.url).searchParams.get("payment");
  const rank = await getListingRank(listing.id);

  if (paymentId) {
    const payment = await getPaymentById(paymentId);
    return NextResponse.json({ ok: true, published: payment?.status === "completed", rank });
  }

  return NextResponse.json({ ok: true, published: listing.status === "published", rank });
}
