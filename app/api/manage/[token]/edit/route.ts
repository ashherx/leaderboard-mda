import { NextResponse } from "next/server";
import { editListingViaToken } from "@/lib/checkout";
import { uploadListingLogo } from "@/lib/storage";
import { getListingByManageToken } from "@/lib/db/listings";
import type { Availability } from "@/lib/db/types";

export async function POST(request: Request, { params }: { params: { token: string } }) {
  const formData = await request.formData();

  const providerName = String(formData.get("providerName") ?? "");
  const pitch = String(formData.get("pitch") ?? "");
  const destinationLink = String(formData.get("destinationLink") ?? "");
  const logo = formData.get("logo");

  const location = String(formData.get("location") ?? "");
  const licensedInsured = String(formData.get("licensedInsured") ?? "") === "yes";
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
    destinationLink,
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
