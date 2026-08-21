import { NextResponse } from "next/server";
import { getListingByManageToken, getListingRank } from "@/lib/db/listings";
import { getPaymentByProviderPaymentId } from "@/lib/db/payments";

/**
 * Polled by the success page (see PendingPaymentNotice) while it waits for
 * the Paddle webhook to land. `txn` (the Paddle transaction id from the
 * checkout that was just opened) is the authoritative signal when given —
 * on a re-bid the listing is already `published`, so that flag alone can't
 * tell "this specific payment confirmed" apart from "still showing the rank
 * from before this checkout." Without `txn` (older links, or genuinely no
 * transaction to watch) it falls back to listing.status.
 */
export async function GET(request: Request, { params }: { params: { token: string } }) {
  const listing = await getListingByManageToken(params.token);
  if (!listing) {
    return NextResponse.json({ ok: false, error: "Invalid or expired link." }, { status: 404 });
  }

  const txn = new URL(request.url).searchParams.get("txn");
  const rank = await getListingRank(listing.id);

  if (txn) {
    const payment = await getPaymentByProviderPaymentId(txn);
    return NextResponse.json({ ok: true, published: payment?.status === "completed", rank });
  }

  return NextResponse.json({ ok: true, published: listing.status === "published", rank });
}
