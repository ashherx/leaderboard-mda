import { NextResponse } from "next/server";
import { submitListingAndCheckout } from "@/lib/checkout";
import { uploadListingLogo } from "@/lib/storage";

export async function POST(request: Request) {
  const formData = await request.formData();

  const categorySlug = String(formData.get("categorySlug") ?? "");
  const providerName = String(formData.get("providerName") ?? "");
  const pitch = String(formData.get("pitch") ?? "");
  const destinationLink = String(formData.get("destinationLink") ?? "");
  const bidDollars = Number(formData.get("bidDollars"));
  const logo = formData.get("logo");

  let logoUrl: string | null = null;
  if (logo instanceof File && logo.size > 0) {
    const uploadResult = await uploadListingLogo(logo);
    if (!uploadResult.ok) {
      return NextResponse.json({ ok: false, error: uploadResult.error }, { status: 400 });
    }
    logoUrl = uploadResult.url;
  }

  const result = await submitListingAndCheckout({
    categorySlug,
    providerName,
    pitch,
    destinationLink,
    logoUrl,
    bidDollars,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    listingId: result.listingId,
    manageToken: result.rawManageToken,
    rank: result.rank,
    categorySlug: result.categorySlug,
  });
}
