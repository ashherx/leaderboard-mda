import { NextResponse } from "next/server";
import { rebidListingViaToken } from "@/lib/checkout";

export async function POST(request: Request, { params }: { params: { token: string } }) {
  const formData = await request.formData();
  const bidDollars = Number(formData.get("bidDollars"));

  const result = await rebidListingViaToken(params.token, bidDollars);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, rank: result.rank });
}
