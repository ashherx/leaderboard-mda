import { NextResponse } from "next/server";
import { rebidListingViaToken } from "@/lib/checkout";

export async function POST(request: Request, { params }: { params: { token: string } }) {
  const formData = await request.formData();
  const additionalBidDollars = Number(formData.get("additionalBidDollars"));

  const result = await rebidListingViaToken(params.token, additionalBidDollars);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, checkoutUrl: result.checkoutUrl, paymentId: result.paymentId });
}
