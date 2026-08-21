import { NextResponse } from "next/server";
import { getListingByManageToken, getListingRank } from "@/lib/db/listings";

/** Polled by the success page (see PendingPaymentNotice) while it waits for the Paddle webhook to publish a just-paid listing. */
export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const listing = await getListingByManageToken(params.token);
  if (!listing) {
    return NextResponse.json({ ok: false, error: "Invalid or expired link." }, { status: 404 });
  }

  const rank = await getListingRank(listing.id);
  return NextResponse.json({ ok: true, published: listing.status === "published", rank });
}
