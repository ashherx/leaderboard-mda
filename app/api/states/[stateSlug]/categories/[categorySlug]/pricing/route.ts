import { NextResponse } from "next/server";
import { getCategoryBySlug } from "@/lib/db/categories";
import { getStateBySlug } from "@/lib/db/locations";
import { getCategoryPricing } from "@/lib/db/listings";

/**
 * Powers ClaimPanel's category dropdown: when a visitor switches which
 * category they're claiming into (within the current state), this returns
 * that category+state's current pricing (floor, current #1 price, what #1
 * costs right now) so the bid stepper and preview rank rebase onto the
 * newly selected category.
 */
export async function GET(
  _request: Request,
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

  const pricing = await getCategoryPricing(category.id, state.id, category.min_bid_cents);
  return NextResponse.json(pricing);
}
