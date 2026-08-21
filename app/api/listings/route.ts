import { NextResponse } from "next/server";
import { submitListingAndCheckout } from "@/lib/checkout";
import { isOwnStorageUrl, uploadListingLogo } from "@/lib/storage";

export async function POST(request: Request) {
  const formData = await request.formData();

  const categorySlug = String(formData.get("categorySlug") ?? "");
  const providerName = String(formData.get("providerName") ?? "");
  const pitch = String(formData.get("pitch") ?? "");
  const destinationLink = String(formData.get("destinationLink") ?? "");
  const bidDollars = Number(formData.get("bidDollars"));
  const logo = formData.get("logo");
  const prefilledLogoUrl = formData.get("logoUrl");

  let logoUrl: string | null = null;
  if (logo instanceof File && logo.size > 0) {
    // A manually chosen file always wins over the auto-fetched favicon.
    const uploadResult = await uploadListingLogo(logo);
    if (!uploadResult.ok) {
      return NextResponse.json({ ok: false, error: uploadResult.error }, { status: 400 });
    }
    logoUrl = uploadResult.url;
  } else if (typeof prefilledLogoUrl === "string" && isOwnStorageUrl(prefilledLogoUrl)) {
    // Already uploaded during the URL-metadata prefill — nothing left to do
    // but trust it, and only because it's verified to be our own bucket.
    logoUrl = prefilledLogoUrl;
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
