import { NextResponse } from "next/server";
import { getCategoryBySlug } from "@/lib/db/categories";
import { getStateBySlug } from "@/lib/db/locations";
import { previewRankForBid } from "@/lib/db/listings";

/**
 * Powers the "try a lower bid" input on a category page: given a dollar
 * amount, returns the rank it would earn among *currently published*
 * listings in this category+state right now. Read-only, no payment involved
 * - the real rank at publish time can differ if other bids land in between.
 */
export async function GET(
  request: Request,
  { params }: { params: { stateSlug: string; categorySlug: string } }
) {
  const state = await getStateBySlug(params.stateSlug);
  if (!state) {
    return NextResponse.json({ error: "State not found" }, { status: 404 });
  }

  const category = await getCategoryBySlug(params.categorySlug);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const bidParam = new URL(request.url).searchParams.get("bid");
  const bidDollars = Number(bidParam);

  if (!Number.isFinite(bidDollars) || !Number.isInteger(bidDollars) || bidDollars <= 0) {
    return NextResponse.json({ error: "bid must be a positive whole-dollar amount" }, { status: 400 });
  }

  const bidAmountCents = bidDollars * 100;
  if (bidAmountCents < category.min_bid_cents) {
    return NextResponse.json(
      { error: `Minimum bid for this category is $${category.min_bid_cents / 100}` },
      { status: 400 }
    );
  }

  const rank = await previewRankForBid(category.id, state.id, bidAmountCents);
  return NextResponse.json({ rank, bidAmountCents });
}
