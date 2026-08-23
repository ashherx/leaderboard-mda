import { NextResponse } from "next/server";
import { editListingViaToken } from "@/lib/checkout";
import { uploadListingLogo } from "@/lib/storage";
import { getListingByManageToken } from "@/lib/db/listings";
import type { Availability } from "@/lib/db/types";

export async function POST(request: Request, { params }: { params: { token: string } }) {
  const formData = await request.formData();

  const providerName = String(formData.get("providerName") ?? "");
  const pitch = String(formData.get("pitch") ?? "");
  // destinationLink is deliberately not read here - it's not an editable
  // field on the manage page (see editListingViaToken for why), so any
  // "destinationLink" a caller sends is simply ignored rather than trusted.
  const logo = formData.get("logo");

  const location = String(formData.get("location") ?? "");
  // Tri-state: "yes" -> true, "no" -> false, anything else (field omitted
  // entirely, since neither checkbox is checked) -> null/not specified.
  const licensedInsuredRaw = formData.get("licensedInsured");
  const licensedInsured = licensedInsuredRaw === "yes" ? true : licensedInsuredRaw === "no" ? false : null;
  const yearsInBusinessRaw = formData.get("yearsInBusiness");
  const yearsInBusiness = yearsInBusinessRaw ? Number(yearsInBusinessRaw) : null;
  const availability = (String(formData.get("availability") ?? "") || null) as Availability | null;
  const specialtyTags = String(formData.get("specialtyTags") ?? "") || null;
  const startingHourlyRateRaw = formData.get("startingHourlyRateDollars");
  const startingHourlyRateDollars = startingHourlyRateRaw ? Number(startingHourlyRateRaw) : null;
  const minProjectRaw = formData.get("minProjectDollars");
  const minProjectDollars = minProjectRaw ? Number(minProjectRaw) : null;

  let logoUrl: string | undefined;
  if (logo instanceof File && logo.size > 0) {
    const uploadResult = await uploadListingLogo(logo);
    if (!uploadResult.ok) {
      return NextResponse.json({ ok: false, error: uploadResult.error }, { status: 400 });
    }
    logoUrl = uploadResult.url;
  } else {
    // No new file chosen - keep the existing logo rather than clearing it.
    const existing = await getListingByManageToken(params.token);
    logoUrl = existing?.logo_url ?? undefined;
  }

  const result = await editListingViaToken(params.token, {
    providerName,
    pitch,
    logoUrl,
    location,
    licensedInsured,
    yearsInBusiness,
    availability,
    specialtyTags,
    startingHourlyRateDollars,
    minProjectDollars,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, rank: result.rank });
}
