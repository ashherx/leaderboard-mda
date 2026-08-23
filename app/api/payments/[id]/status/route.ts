import { NextResponse } from "next/server";
import { getPaymentById } from "@/lib/db/payments";
import { getListingRank } from "@/lib/db/listings";

/**
 * Token-less counterpart to /api/manage/[token]/status - polled by the
 * success page when a checkout turned into a top-up of a listing the
 * submitter doesn't control (a duplicate-URL top-up, see
 * submitListingAndCheckout), so there's no manage token to scope the lookup
 * by. A payment id alone is low-sensitivity (an opaque audit-row id, not an
 * auth credential), so this is safe to expose unauthenticated.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const payment = await getPaymentById(params.id);
  if (!payment) {
    return NextResponse.json({ ok: false, error: "Invalid or expired payment." }, { status: 404 });
  }

  const rank = await getListingRank(payment.listing_id);
  return NextResponse.json({ ok: true, published: payment.status === "completed", rank });
}
